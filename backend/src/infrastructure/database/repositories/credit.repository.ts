import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  AdjustCreditsInput,
  CreateCreditPlanInput,
  CreateCreditPurchaseInput,
  CREDIT_REPOSITORY,
  ICreditRepository,
  UpdateCreditPlanInput,
  UpdateCreditSystemConfigInput,
} from '../../../domain/credit/interfaces/credit.repository';
import { CreditPlan } from '../../../domain/credit/entities/credit-plan.entity';
import { CreditSystemConfig } from '../../../domain/credit/entities/credit-system-config.entity';
import {
  CreditPurchase,
  CreditPurchaseStatus,
} from '../../../domain/credit/entities/credit-purchase.entity';
import {
  CreateCreditOutboxEventInput,
  CreditPurchaseOutbox,
  CreditPurchaseOutboxStatus,
} from '../../../domain/credit/entities/credit-purchase-outbox.entity';
import {
  CreditTransaction,
  CreditTransactionType,
} from '../../../domain/credit/entities/credit-transaction.entity';
import {
  ReferralRewardLog,
  ReferralRewardType,
} from '../../../domain/credit/entities/referral-reward-log.entity';
import { PaginationParams } from '../../../shared/pagination/pagination.types';

const CREDIT_SYSTEM_CONFIG_ID = 1;
const ORDER_BY_CREATED_DESC = { createdAt: 'desc' } as const;

type NumericField = number | { toNumber: () => number };
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type CreditPlanRecord = {
  id: string;
  name: string;
  creditsAmount: number;
  priceBrl: NumericField;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CreditSystemConfigRecord = {
  id: number;
  registrationBonusCredits: number;
  referralEnabled: boolean;
  refereeRegistrationBonusCredits: number;
  referrerFirstPurchaseBonusCredits: number;
  createdAt: Date;
  updatedAt: Date;
};

type CreditPurchaseRecord = {
  id: string;
  userId: string;
  creditPlanId: string;
  creditsAmount: number;
  amountBrl: NumericField;
  status: string;
  provider: string;
  correlationId: string;
  stripePaymentIntentId: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreditOutboxRecord = {
  id: string;
  creditPurchaseId: string;
  eventType: string;
  payload: unknown;
  status: string;
  attempts: number;
  nextAttemptAt: Date | null;
  lastError: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreditTransactionRecord = {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  correlationId: string | null;
  metadata: unknown;
  createdAt: Date;
};

type ReferralRewardLogRecord = {
  id: string;
  referrerUserId: string;
  refereeUserId: string;
  rewardType: string;
  creditsGranted: number;
  correlationId: string | null;
  createdAt: Date;
};

type CreditPurchaseWhere = { id: string } | { correlationId: string };

@Injectable()
export class PrismaCreditRepository implements ICreditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCreditPlanById(id: string): Promise<CreditPlan | null> {
    const plan = await this.prisma.creditPlan.findUnique({ where: { id } });
    return plan ? this.toCreditPlan(plan) : null;
  }

  async listCreditPlans(
    params: PaginationParams,
    onlyActive = false,
  ): Promise<{ items: CreditPlan[]; total: number }> {
    const where = onlyActive ? { isActive: true } : undefined;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.creditPlan.findMany({
        where,
        orderBy: ORDER_BY_CREATED_DESC,
        skip: params.skip,
        take: params.limit,
      }),
      this.prisma.creditPlan.count({ where }),
    ]);

    return {
      items: (items as CreditPlanRecord[]).map((plan) =>
        this.toCreditPlan(plan),
      ),
      total,
    };
  }

  async createCreditPlan(input: CreateCreditPlanInput): Promise<CreditPlan> {
    const plan = await this.prisma.creditPlan.create({ data: input });
    return this.toCreditPlan(plan);
  }

  async updateCreditPlan(
    id: string,
    input: UpdateCreditPlanInput,
  ): Promise<CreditPlan> {
    const plan = await this.prisma.creditPlan.update({
      where: { id },
      data: input,
    });
    return this.toCreditPlan(plan);
  }

  async deleteCreditPlan(id: string): Promise<void> {
    await this.prisma.creditPlan.delete({ where: { id } });
  }

  async getCreditSystemConfig(): Promise<CreditSystemConfig> {
    const config = await this.prisma.creditSystemConfig.upsert({
      where: { id: CREDIT_SYSTEM_CONFIG_ID },
      update: {},
      create: {
        id: CREDIT_SYSTEM_CONFIG_ID,
        registrationBonusCredits: 250,
        referralEnabled: true,
        refereeRegistrationBonusCredits: 50,
        referrerFirstPurchaseBonusCredits: 100,
      },
    });
    return this.toCreditSystemConfig(config);
  }

  async updateCreditSystemConfig(
    input: UpdateCreditSystemConfigInput,
  ): Promise<CreditSystemConfig> {
    const config = await this.prisma.creditSystemConfig.upsert({
      where: { id: CREDIT_SYSTEM_CONFIG_ID },
      update: {
        ...input,
      },
      create: {
        id: CREDIT_SYSTEM_CONFIG_ID,
        registrationBonusCredits: input.registrationBonusCredits ?? 250,
        referralEnabled: input.referralEnabled ?? true,
        refereeRegistrationBonusCredits:
          input.refereeRegistrationBonusCredits ?? 50,
        referrerFirstPurchaseBonusCredits:
          input.referrerFirstPurchaseBonusCredits ?? 100,
      },
    });
    return this.toCreditSystemConfig(config);
  }

  async createCreditPurchaseWithOutbox(
    input: CreateCreditPurchaseInput,
    outbox: CreateCreditOutboxEventInput,
  ): Promise<CreditPurchase> {
    const purchase = await this.prisma.$transaction(async (tx) => {
      const createdPurchase = await tx.creditPurchase.create({
        data: {
          userId: input.userId,
          creditPlanId: input.creditPlanId,
          creditsAmount: input.creditsAmount,
          amountBrl: input.amountBrl,
          status: CreditPurchaseStatus.PENDING,
          provider: input.provider,
          correlationId: input.correlationId,
        },
      });

      await tx.creditPurchaseOutbox.create({
        data: {
          creditPurchaseId: createdPurchase.id,
          eventType: outbox.eventType,
          payload: this.toJsonObject(outbox.payload),
          status: CreditPurchaseOutboxStatus.PENDING,
        },
      });

      return createdPurchase;
    });

    return this.toCreditPurchase(purchase);
  }

  async createCreditPurchase(
    input: CreateCreditPurchaseInput,
  ): Promise<CreditPurchase> {
    const purchase = await this.prisma.creditPurchase.create({
      data: {
        userId: input.userId,
        creditPlanId: input.creditPlanId,
        creditsAmount: input.creditsAmount,
        amountBrl: input.amountBrl,
        status: CreditPurchaseStatus.PENDING,
        provider: input.provider,
        correlationId: input.correlationId,
      },
    });
    return this.toCreditPurchase(purchase);
  }

  async findCreditPurchaseById(id: string): Promise<CreditPurchase | null> {
    const purchase = await this.findUniqueCreditPurchase({ id });
    return purchase ? this.toCreditPurchase(purchase) : null;
  }

  async findCreditPurchaseByCorrelationId(
    correlationId: string,
  ): Promise<CreditPurchase | null> {
    const purchase = await this.findUniqueCreditPurchase({ correlationId });
    return purchase ? this.toCreditPurchase(purchase) : null;
  }

  async updateCreditPurchaseStatus(
    id: string,
    status: CreditPurchaseStatus,
    failureReason?: string | null,
    stripePaymentIntentId?: string | null,
  ): Promise<CreditPurchase> {
    const purchase = await this.prisma.creditPurchase.update({
      where: { id },
      data: {
        status,
        failureReason: failureReason ?? null,
        stripePaymentIntentId: stripePaymentIntentId ?? null,
      },
    });
    return this.toCreditPurchase(purchase);
  }

  async listUserCreditTransactions(
    userId: string,
    params: PaginationParams,
  ): Promise<{ items: CreditTransaction[]; total: number }> {
    const where = { userId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.creditTransaction.findMany({
        where,
        orderBy: ORDER_BY_CREATED_DESC,
        skip: params.skip,
        take: params.limit,
      }),
      this.prisma.creditTransaction.count({ where }),
    ]);

    return {
      items: (items as CreditTransactionRecord[]).map((item) =>
        this.toCreditTransaction(item),
      ),
      total,
    };
  }

  async listUserCreditPurchases(
    userId: string,
    params: PaginationParams,
  ): Promise<{ items: CreditPurchase[]; total: number }> {
    const where = { userId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.creditPurchase.findMany({
        where,
        orderBy: ORDER_BY_CREATED_DESC,
        skip: params.skip,
        take: params.limit,
      }),
      this.prisma.creditPurchase.count({ where }),
    ]);

    return {
      items: (items as CreditPurchaseRecord[]).map((item) =>
        this.toCreditPurchase(item),
      ),
      total,
    };
  }

  async adjustUserCredits(
    input: AdjustCreditsInput,
  ): Promise<CreditTransaction> {
    return this.prisma.$transaction(async (tx) => {
      if (input.correlationId) {
        const existing = await tx.creditTransaction.findFirst({
          where: {
            userId: input.userId,
            correlationId: input.correlationId,
          },
        });
        if (existing) {
          return this.toCreditTransaction(existing);
        }
      }

      const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { creditsBalance: true },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const balanceBefore = user.creditsBalance;
      const balanceAfter = balanceBefore + input.amount;

      if (balanceAfter < 0) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      await tx.user.update({
        where: { id: input.userId },
        data: { creditsBalance: balanceAfter },
      });

      const transaction = await tx.creditTransaction.create({
        data: {
          userId: input.userId,
          type: input.type,
          amount: input.amount,
          balanceBefore,
          balanceAfter,
          description: input.description ?? null,
          correlationId: input.correlationId ?? null,
          metadata: input.metadata
            ? this.toJsonObject(input.metadata)
            : undefined,
        },
      });

      return this.toCreditTransaction(transaction);
    });
  }

  async getUserCreditsBalance(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditsBalance: true },
    });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    return user.creditsBalance;
  }

  async markFirstApprovedCreditPurchaseDone(userId: string): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: {
        id: userId,
        firstApprovedCreditPurchaseDone: false,
      },
      data: {
        firstApprovedCreditPurchaseDone: true,
      },
    });
    return result.count > 0;
  }

  async findOutboxEventsReadyToDispatch(
    batchSize: number,
    referenceDate: Date,
  ): Promise<CreditPurchaseOutbox[]> {
    const events = await this.prisma.creditPurchaseOutbox.findMany({
      where: {
        OR: [
          { status: CreditPurchaseOutboxStatus.PENDING },
          {
            status: CreditPurchaseOutboxStatus.FAILED,
            nextAttemptAt: { lte: referenceDate },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });

    return (events as CreditOutboxRecord[]).map((event) =>
      this.toCreditOutbox(event),
    );
  }

  async markOutboxEventAsSent(eventId: string): Promise<void> {
    await this.prisma.creditPurchaseOutbox.update({
      where: { id: eventId },
      data: {
        status: CreditPurchaseOutboxStatus.SENT,
        publishedAt: new Date(),
        nextAttemptAt: null,
        lastError: null,
      },
    });
  }

  async markOutboxEventForRetry(
    eventId: string,
    status: CreditPurchaseOutboxStatus,
    attempts: number,
    nextAttemptAt: Date | null,
    lastError: string | null,
  ): Promise<void> {
    await this.prisma.creditPurchaseOutbox.update({
      where: { id: eventId },
      data: {
        status,
        attempts,
        nextAttemptAt,
        lastError,
      },
    });
  }

  async findReferralRewardLog(
    referrerUserId: string,
    refereeUserId: string,
    rewardType: ReferralRewardType,
  ): Promise<ReferralRewardLog | null> {
    const log = await this.prisma.referralRewardLog.findFirst({
      where: {
        referrerUserId,
        refereeUserId,
        rewardType,
      },
    });

    return log ? this.toReferralRewardLog(log) : null;
  }

  async createReferralRewardLog(input: {
    referrerUserId: string;
    refereeUserId: string;
    rewardType: ReferralRewardType;
    creditsGranted: number;
    correlationId?: string;
  }): Promise<ReferralRewardLog> {
    const log = await this.prisma.referralRewardLog.create({
      data: {
        referrerUserId: input.referrerUserId,
        refereeUserId: input.refereeUserId,
        rewardType: input.rewardType,
        creditsGranted: input.creditsGranted,
        correlationId: input.correlationId ?? null,
      },
    });
    return this.toReferralRewardLog(log);
  }

  private async findUniqueCreditPurchase(
    where: CreditPurchaseWhere,
  ): Promise<CreditPurchaseRecord | null> {
    return this.prisma.creditPurchase.findUnique({
      where,
    });
  }

  private toCreditPlan(plan: CreditPlanRecord): CreditPlan {
    return {
      id: plan.id,
      name: plan.name,
      creditsAmount: plan.creditsAmount,
      priceBrl: this.toNumber(plan.priceBrl),
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  private toCreditSystemConfig(
    config: CreditSystemConfigRecord,
  ): CreditSystemConfig {
    return {
      id: config.id,
      registrationBonusCredits: config.registrationBonusCredits,
      referralEnabled: config.referralEnabled,
      refereeRegistrationBonusCredits: config.refereeRegistrationBonusCredits,
      referrerFirstPurchaseBonusCredits:
        config.referrerFirstPurchaseBonusCredits,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  private toCreditPurchase(purchase: CreditPurchaseRecord): CreditPurchase {
    return {
      id: purchase.id,
      userId: purchase.userId,
      creditPlanId: purchase.creditPlanId,
      creditsAmount: purchase.creditsAmount,
      amountBrl: this.toNumber(purchase.amountBrl),
      status: purchase.status as CreditPurchaseStatus,
      provider: purchase.provider,
      correlationId: purchase.correlationId,
      stripePaymentIntentId: purchase.stripePaymentIntentId ?? null,
      failureReason: purchase.failureReason ?? null,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    };
  }

  private toCreditOutbox(event: CreditOutboxRecord): CreditPurchaseOutbox {
    return {
      id: event.id,
      creditPurchaseId: event.creditPurchaseId,
      eventType: event.eventType,
      payload: (event.payload ?? {}) as Record<string, unknown>,
      status: event.status as CreditPurchaseOutboxStatus,
      attempts: event.attempts,
      nextAttemptAt: event.nextAttemptAt,
      lastError: event.lastError,
      publishedAt: event.publishedAt,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  private toCreditTransaction(
    transaction: CreditTransactionRecord,
  ): CreditTransaction {
    return {
      id: transaction.id,
      userId: transaction.userId,
      type: transaction.type as CreditTransactionType,
      amount: transaction.amount,
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
      description: transaction.description,
      correlationId: transaction.correlationId,
      metadata: (transaction.metadata ?? null) as Record<
        string,
        unknown
      > | null,
      createdAt: transaction.createdAt,
    };
  }

  private toReferralRewardLog(log: ReferralRewardLogRecord): ReferralRewardLog {
    return {
      id: log.id,
      referrerUserId: log.referrerUserId,
      refereeUserId: log.refereeUserId,
      rewardType: log.rewardType as ReferralRewardType,
      creditsGranted: log.creditsGranted,
      correlationId: log.correlationId,
      createdAt: log.createdAt,
    };
  }

  private toNumber(value: NumericField): number {
    return typeof value === 'number' ? value : value.toNumber();
  }

  private toJsonObject(value: Record<string, unknown>): JsonObject {
    const entries = Object.entries(value).map(([key, entryValue]) => [
      key,
      this.toJsonValue(entryValue),
    ]);
    return Object.fromEntries(entries);
  }

  private toJsonValue(value: unknown): JsonValue {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.toJsonValue(item));
    }

    if (typeof value === 'object') {
      return this.toJsonObject(value as Record<string, unknown>);
    }

    return String(value);
  }
}

export const CREDIT_REPOSITORY_PROVIDER = {
  provide: CREDIT_REPOSITORY,
  useClass: PrismaCreditRepository,
};
