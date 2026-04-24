import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaginationService } from '../../shared/pagination/pagination.service';
import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../shared/pagination/pagination.types';
import { CREDIT_REPOSITORY } from '../../domain/credit/interfaces/credit.repository';
import type {
  CreateCreditPlanInput,
  ICreditRepository,
  UpdateCreditPlanInput,
  UpdateCreditSystemConfigInput,
} from '../../domain/credit/interfaces/credit.repository';
import { CreditPlan } from '../../domain/credit/entities/credit-plan.entity';
import { CreditSystemConfig } from '../../domain/credit/entities/credit-system-config.entity';
import {
  CreditPurchase,
  CreditPurchaseStatus,
} from '../../domain/credit/entities/credit-purchase.entity';
import { CreditTransactionType } from '../../domain/credit/entities/credit-transaction.entity';
import { User } from '../../domain/user/entities/user.entity';
import { USER_REPOSITORY } from '../../domain/user/interfaces/user.repository';
import type { IUserRepository } from '../../domain/user/interfaces/user.repository';
import { CREDIT_MESSAGES_PT_BR } from '../../shared/credit/credit-messages.pt-br';
import { PaymentGatewayFactory } from '../../infrastructure/payment/payment-gateway.factory';
import { ApiLogger } from '../../shared/logger/api-logger';
import { ReferralRewardType } from '../../domain/credit/entities/referral-reward-log.entity';
import { ConfigService } from '@nestjs/config';
import { isRmqPaymentFlow } from '../../shared/config/platform.config';

export const CREDIT_CHECKOUT_REQUESTED_EVENT = 'credit.checkout.requested';
export const CREDIT_CHECKOUT_FAILED_EVENT = 'credit.checkout.failed';
const CREDIT_LOGGER_CONTEXT = 'CreditService';

@Injectable()
export class CreditService {
  constructor(
    @Inject(CREDIT_REPOSITORY)
    private readonly creditRepository: ICreditRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly paymentGatewayFactory: PaymentGatewayFactory,
    private readonly paginationService: PaginationService,
    private readonly configService: ConfigService,
  ) {}

  async getUserBalance(userId: string): Promise<number> {
    return this.creditRepository.getUserCreditsBalance(userId);
  }

  async getUserTransactionsPage(
    userId: string,
    paginationQuery: PaginationQueryInput,
  ): Promise<PaginatedResult<unknown>> {
    const params = this.paginationService.resolve(paginationQuery);
    const { items, total } =
      await this.creditRepository.listUserCreditTransactions(userId, params);
    return this.paginationService.buildResult(items, total, params);
  }

  async getUserCreditPurchasesPage(
    userId: string,
    paginationQuery: PaginationQueryInput,
  ): Promise<PaginatedResult<CreditPurchase>> {
    const params = this.paginationService.resolve(paginationQuery);
    const { items, total } =
      await this.creditRepository.listUserCreditPurchases(userId, params);
    return this.paginationService.buildResult(items, total, params);
  }

  async getActivePlansPage(
    paginationQuery: PaginationQueryInput,
  ): Promise<PaginatedResult<CreditPlan>> {
    const params = this.paginationService.resolve(paginationQuery);
    const { items, total } = await this.creditRepository.listCreditPlans(
      params,
      true,
    );
    return this.paginationService.buildResult(items, total, params);
  }

  async createCheckout(
    userId: string,
    creditPlanId: string,
  ): Promise<CreditPurchase> {
    const plan = await this.creditRepository.findCreditPlanById(creditPlanId);
    if (!plan || !plan.isActive) {
      throw new NotFoundException(CREDIT_MESSAGES_PT_BR.planNotFound);
    }

    const provider = this.paymentGatewayFactory.resolveDefaultProvider();
    const correlationId = randomUUID();
    const useRmqFlow = isRmqPaymentFlow(this.configService);

    const purchaseInput = {
      userId,
      creditPlanId: plan.id,
      creditsAmount: plan.creditsAmount,
      amountBrl: plan.priceBrl,
      provider,
      correlationId,
    };
    const purchase = useRmqFlow
      ? await this.creditRepository.createCreditPurchaseWithOutbox(
          purchaseInput,
          {
            eventType: CREDIT_CHECKOUT_REQUESTED_EVENT,
            payload: {
              creditsAmount: plan.creditsAmount,
              amountBrl: plan.priceBrl,
              provider,
              correlationId,
              retryCount: 0,
            },
          },
        )
      : await this.creditRepository.createCreditPurchase(purchaseInput);

    if (!useRmqFlow) {
      await this.processCheckoutSynchronously(purchase);
      return (await this.markCheckoutLookup(purchase.id)) ?? purchase;
    }

    return purchase;
  }

  async markCheckoutLookup(purchaseId: string): Promise<CreditPurchase | null> {
    return this.creditRepository.findCreditPurchaseById(purchaseId);
  }

  async markCheckoutCompleted(
    purchaseId: string,
    externalReference?: string,
  ): Promise<CreditPurchase> {
    const purchase =
      await this.creditRepository.findCreditPurchaseById(purchaseId);
    if (!purchase) {
      throw new NotFoundException(CREDIT_MESSAGES_PT_BR.creditPurchaseNotFound);
    }

    const updated = await this.creditRepository.updateCreditPurchaseStatus(
      purchase.id,
      CreditPurchaseStatus.COMPLETED,
      null,
      externalReference,
    );

    await this.creditRepository.adjustUserCredits({
      userId: purchase.userId,
      amount: purchase.creditsAmount,
      type: CreditTransactionType.CREDIT_PURCHASE,
      correlationId: `credit-purchase:${purchase.id}`,
      description: 'Credito aprovado por compra de plano',
      metadata: {
        creditPurchaseId: purchase.id,
        creditPlanId: purchase.creditPlanId,
        amountBrl: purchase.amountBrl,
      },
    });

    await this.tryRewardReferrerOnFirstPurchase(purchase.userId, purchase.id);

    return updated;
  }

  async markCheckoutFailed(
    purchaseId: string,
    reason: string,
    externalReference?: string,
  ): Promise<CreditPurchase> {
    const purchase =
      await this.creditRepository.findCreditPurchaseById(purchaseId);
    if (!purchase) {
      throw new NotFoundException(CREDIT_MESSAGES_PT_BR.creditPurchaseNotFound);
    }

    return this.creditRepository.updateCreditPurchaseStatus(
      purchase.id,
      CreditPurchaseStatus.FAILED,
      reason,
      externalReference,
    );
  }

  async consumeCredits(
    userId: string,
    amount: number,
    description: string,
    correlationId?: string,
  ): Promise<void> {
    this.validatePositiveCredits(amount);
    try {
      await this.creditRepository.adjustUserCredits({
        userId,
        amount: -amount,
        type: CreditTransactionType.CREDIT_CONSUMPTION,
        description,
        correlationId,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
        throw new BadRequestException(
          CREDIT_MESSAGES_PT_BR.insufficientCredits,
        );
      }
      throw error;
    }
  }

  async applyRegistrationBonuses(userId: string): Promise<void> {
    const user = await this.getUserOrFail(userId);
    const config = await this.creditRepository.getCreditSystemConfig();

    if (config.registrationBonusCredits > 0) {
      await this.creditRepository.adjustUserCredits({
        userId,
        amount: config.registrationBonusCredits,
        type: CreditTransactionType.REGISTRATION_BONUS,
        correlationId: `registration:${userId}:base`,
        description: 'Bonus de cadastro',
      });
    }

    if (
      !config.referralEnabled ||
      !user.referredByUserId ||
      user.referralSignupBonusGranted
    ) {
      return;
    }

    if (config.refereeRegistrationBonusCredits > 0) {
      await this.creditRepository.adjustUserCredits({
        userId,
        amount: config.refereeRegistrationBonusCredits,
        type: CreditTransactionType.REFEREE_REGISTRATION_BONUS,
        correlationId: `registration:${userId}:referee`,
        description: 'Bonus de cadastro por indicacao',
      });
    }

    const existing = await this.creditRepository.findReferralRewardLog(
      user.referredByUserId,
      user.id,
      ReferralRewardType.REFEREE_REGISTRATION,
    );

    if (!existing) {
      await this.creditRepository.createReferralRewardLog({
        referrerUserId: user.referredByUserId,
        refereeUserId: user.id,
        rewardType: ReferralRewardType.REFEREE_REGISTRATION,
        creditsGranted: config.refereeRegistrationBonusCredits,
        correlationId: `registration:${user.id}:referee`,
      });
    }

    await this.userRepository.update(user.id, {
      referralSignupBonusGranted: true,
    });
  }

  async listAdminPlansPage(
    paginationQuery: PaginationQueryInput,
  ): Promise<PaginatedResult<CreditPlan>> {
    const params = this.paginationService.resolve(paginationQuery);
    const { items, total } = await this.creditRepository.listCreditPlans(
      params,
      false,
    );
    return this.paginationService.buildResult(items, total, params);
  }

  async createAdminPlan(input: CreateCreditPlanInput): Promise<CreditPlan> {
    this.validateCreditPlanPayload(input);
    return this.creditRepository.createCreditPlan(input);
  }

  async updateAdminPlan(
    id: string,
    input: UpdateCreditPlanInput,
  ): Promise<CreditPlan> {
    if (input.creditsAmount !== undefined) {
      this.validatePositiveCredits(input.creditsAmount);
    }
    if (input.priceBrl !== undefined) {
      this.validatePriceBrl(input.priceBrl);
    }
    if (input.name !== undefined && !input.name.trim()) {
      throw new BadRequestException(
        CREDIT_MESSAGES_PT_BR.creditPlanNameRequired,
      );
    }
    return this.creditRepository.updateCreditPlan(id, input);
  }

  async deleteAdminPlan(id: string): Promise<void> {
    await this.creditRepository.deleteCreditPlan(id);
  }

  async getAdminConfig(): Promise<CreditSystemConfig> {
    return this.creditRepository.getCreditSystemConfig();
  }

  async updateAdminConfig(
    input: UpdateCreditSystemConfigInput,
  ): Promise<CreditSystemConfig> {
    this.validateConfigInput(input);
    return this.creditRepository.updateCreditSystemConfig(input);
  }

  private async tryRewardReferrerOnFirstPurchase(
    refereeUserId: string,
    creditPurchaseId: string,
  ): Promise<void> {
    const config = await this.creditRepository.getCreditSystemConfig();
    if (
      !config.referralEnabled ||
      config.referrerFirstPurchaseBonusCredits <= 0
    ) {
      return;
    }

    const referee = await this.userRepository.findById(refereeUserId);
    if (!referee?.referredByUserId) {
      return;
    }

    const becameFirstPurchase =
      await this.creditRepository.markFirstApprovedCreditPurchaseDone(
        referee.id,
      );
    if (!becameFirstPurchase) {
      return;
    }

    const existing = await this.creditRepository.findReferralRewardLog(
      referee.referredByUserId,
      referee.id,
      ReferralRewardType.REFERRER_FIRST_PURCHASE,
    );

    if (existing) {
      return;
    }

    await this.creditRepository.adjustUserCredits({
      userId: referee.referredByUserId,
      amount: config.referrerFirstPurchaseBonusCredits,
      type: CreditTransactionType.REFERRER_FIRST_PURCHASE_BONUS,
      correlationId: `referrer-first-purchase:${referee.id}`,
      description: 'Bonus por primeira compra do indicado',
      metadata: {
        refereeUserId: referee.id,
        creditPurchaseId,
      },
    });

    await this.creditRepository.createReferralRewardLog({
      referrerUserId: referee.referredByUserId,
      refereeUserId: referee.id,
      rewardType: ReferralRewardType.REFERRER_FIRST_PURCHASE,
      creditsGranted: config.referrerFirstPurchaseBonusCredits,
      correlationId: `referrer-first-purchase:${referee.id}`,
    });

    ApiLogger.log(
      `Bonus de indicacao aplicado para referrer=${referee.referredByUserId} referee=${referee.id}`,
      CREDIT_LOGGER_CONTEXT,
    );
  }

  private async getUserOrFail(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(CREDIT_MESSAGES_PT_BR.userNotFound);
    }
    return user;
  }

  private validateCreditPlanPayload(input: CreateCreditPlanInput): void {
    if (!input.name.trim()) {
      throw new BadRequestException(
        CREDIT_MESSAGES_PT_BR.creditPlanNameRequired,
      );
    }
    this.validatePositiveCredits(input.creditsAmount);
    this.validatePriceBrl(input.priceBrl);
  }

  private validateConfigInput(input: UpdateCreditSystemConfigInput): void {
    if (input.registrationBonusCredits !== undefined) {
      this.validateNonNegativeCredits(input.registrationBonusCredits);
    }
    if (input.refereeRegistrationBonusCredits !== undefined) {
      this.validateNonNegativeCredits(input.refereeRegistrationBonusCredits);
    }
    if (input.referrerFirstPurchaseBonusCredits !== undefined) {
      this.validateNonNegativeCredits(input.referrerFirstPurchaseBonusCredits);
    }
  }

  private validatePositiveCredits(value: number): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(CREDIT_MESSAGES_PT_BR.invalidCreditAmount);
    }
  }

  private validateNonNegativeCredits(value: number): void {
    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException(CREDIT_MESSAGES_PT_BR.invalidCreditAmount);
    }
  }

  private validatePriceBrl(value: number): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(CREDIT_MESSAGES_PT_BR.invalidPriceBrl);
    }
  }

  private async processCheckoutSynchronously(
    purchase: CreditPurchase,
  ): Promise<void> {
    try {
      const gateway = this.paymentGatewayFactory.resolveGateway(
        purchase.provider,
      );
      const result = await gateway.processPayment({
        purchaseId: purchase.id,
        amount: purchase.amountBrl,
        correlationId: purchase.correlationId,
        currency: this.configService.get<string>('STRIPE_CURRENCY', 'brl'),
        purchaseKind: 'credit',
      });
      if (result.approved) {
        await this.markCheckoutCompleted(purchase.id, result.externalReference);
        return;
      }
      await this.markCheckoutFailed(
        purchase.id,
        result.failureReason ?? 'sync_credit_payment_declined',
        result.externalReference,
      );
    } catch (error) {
      await this.markCheckoutFailed(
        purchase.id,
        error instanceof Error ? error.message : 'sync_credit_payment_failed',
      );
      throw error;
    }
  }
}
