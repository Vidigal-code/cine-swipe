import { Injectable } from '@nestjs/common';
import {
  AdjustCreditsInput,
  CreateCreditPlanInput,
  CreateCreditPurchaseInput,
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
import { FirebaseStateStoreService } from '../firebase-state-store.service';
import {
  createUuid,
  nowIso,
  paginateDescendingByCreatedAt,
  toDate,
  toPlainRecord,
} from '../firebase-state.utils';
import {
  FirebaseCreditPlanRecord,
  FirebaseCreditPurchaseOutboxRecord,
  FirebaseCreditPurchaseRecord,
  FirebaseCreditSystemConfigRecord,
  FirebaseCreditTransactionRecord,
  FirebaseReferralRewardLogRecord,
} from '../firebase-state.types';

const CREDIT_SYSTEM_CONFIG_ID = 1;

@Injectable()
export class FirebaseCreditRepository implements ICreditRepository {
  constructor(private readonly stateStore: FirebaseStateStoreService) {}

  async findCreditPlanById(id: string): Promise<CreditPlan | null> {
    const state = await this.stateStore.readState();
    const plan = state.creditPlans[id];
    return plan ? this.toCreditPlan(plan) : null;
  }

  async listCreditPlans(
    params: PaginationParams,
    onlyActive = false,
  ): Promise<{ items: CreditPlan[]; total: number }> {
    const state = await this.stateStore.readState();
    const allPlans = Object.values(state.creditPlans).filter(
      (plan) => !onlyActive || plan.isActive,
    );
    const paginated = paginateDescendingByCreatedAt(allPlans, params);
    return {
      items: paginated.items.map((item) => this.toCreditPlan(item)),
      total: paginated.total,
    };
  }

  async createCreditPlan(input: CreateCreditPlanInput): Promise<CreditPlan> {
    return this.stateStore.runStateTransaction((state) => {
      const timestamp = nowIso();
      const record: FirebaseCreditPlanRecord = {
        id: createUuid(),
        name: input.name,
        creditsAmount: input.creditsAmount,
        priceBrl: input.priceBrl,
        isActive: input.isActive,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      state.creditPlans[record.id] = record;
      return this.toCreditPlan(record);
    });
  }

  async updateCreditPlan(
    id: string,
    input: UpdateCreditPlanInput,
  ): Promise<CreditPlan> {
    return this.stateStore.runStateTransaction((state) => {
      const existing = state.creditPlans[id];
      if (!existing) {
        throw new Error('CREDIT_PLAN_NOT_FOUND');
      }
      const updated: FirebaseCreditPlanRecord = {
        ...existing,
        name: input.name ?? existing.name,
        creditsAmount: input.creditsAmount ?? existing.creditsAmount,
        priceBrl: input.priceBrl ?? existing.priceBrl,
        isActive: input.isActive ?? existing.isActive,
        updatedAt: nowIso(),
      };
      state.creditPlans[id] = updated;
      return this.toCreditPlan(updated);
    });
  }

  async deleteCreditPlan(id: string): Promise<void> {
    await this.stateStore.runStateTransaction((state) => {
      delete state.creditPlans[id];
      return true;
    });
  }

  async getCreditSystemConfig(): Promise<CreditSystemConfig> {
    return this.stateStore.runStateTransaction((state) => {
      if (!state.creditSystemConfig) {
        state.creditSystemConfig = this.createDefaultCreditSystemConfig();
      }
      return this.toCreditSystemConfig(state.creditSystemConfig);
    });
  }

  async updateCreditSystemConfig(
    input: UpdateCreditSystemConfigInput,
  ): Promise<CreditSystemConfig> {
    return this.stateStore.runStateTransaction((state) => {
      const existing =
        state.creditSystemConfig ?? this.createDefaultCreditSystemConfig();
      const updated: FirebaseCreditSystemConfigRecord = {
        ...existing,
        registrationBonusCredits:
          input.registrationBonusCredits ?? existing.registrationBonusCredits,
        referralEnabled: input.referralEnabled ?? existing.referralEnabled,
        refereeRegistrationBonusCredits:
          input.refereeRegistrationBonusCredits ??
          existing.refereeRegistrationBonusCredits,
        referrerFirstPurchaseBonusCredits:
          input.referrerFirstPurchaseBonusCredits ??
          existing.referrerFirstPurchaseBonusCredits,
        updatedAt: nowIso(),
      };
      state.creditSystemConfig = updated;
      return this.toCreditSystemConfig(updated);
    });
  }

  async createCreditPurchaseWithOutbox(
    input: CreateCreditPurchaseInput,
    outbox: CreateCreditOutboxEventInput,
  ): Promise<CreditPurchase> {
    return this.stateStore.runStateTransaction((state) => {
      const purchaseTimestamp = nowIso();
      const purchaseRecord: FirebaseCreditPurchaseRecord = {
        id: createUuid(),
        userId: input.userId,
        creditPlanId: input.creditPlanId,
        creditsAmount: input.creditsAmount,
        amountBrl: input.amountBrl,
        status: CreditPurchaseStatus.PENDING,
        provider: input.provider,
        correlationId: input.correlationId,
        stripePaymentIntentId: null,
        failureReason: null,
        createdAt: purchaseTimestamp,
        updatedAt: purchaseTimestamp,
      };
      state.creditPurchases[purchaseRecord.id] = purchaseRecord;

      const outboxTimestamp = nowIso();
      const outboxRecord: FirebaseCreditPurchaseOutboxRecord = {
        id: createUuid(),
        creditPurchaseId: purchaseRecord.id,
        eventType: outbox.eventType,
        payload: toPlainRecord(outbox.payload),
        status: CreditPurchaseOutboxStatus.PENDING,
        attempts: 0,
        nextAttemptAt: null,
        lastError: null,
        publishedAt: null,
        createdAt: outboxTimestamp,
        updatedAt: outboxTimestamp,
      };
      state.creditPurchaseOutbox[outboxRecord.id] = outboxRecord;
      return this.toCreditPurchase(purchaseRecord);
    });
  }

  async createCreditPurchase(
    input: CreateCreditPurchaseInput,
  ): Promise<CreditPurchase> {
    return this.stateStore.runStateTransaction((state) => {
      const timestamp = nowIso();
      const purchaseRecord: FirebaseCreditPurchaseRecord = {
        id: createUuid(),
        userId: input.userId,
        creditPlanId: input.creditPlanId,
        creditsAmount: input.creditsAmount,
        amountBrl: input.amountBrl,
        status: CreditPurchaseStatus.PENDING,
        provider: input.provider,
        correlationId: input.correlationId,
        stripePaymentIntentId: null,
        failureReason: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      state.creditPurchases[purchaseRecord.id] = purchaseRecord;
      return this.toCreditPurchase(purchaseRecord);
    });
  }

  async findCreditPurchaseById(id: string): Promise<CreditPurchase | null> {
    const state = await this.stateStore.readState();
    const purchase = state.creditPurchases[id];
    return purchase ? this.toCreditPurchase(purchase) : null;
  }

  async findCreditPurchaseByCorrelationId(
    correlationId: string,
  ): Promise<CreditPurchase | null> {
    const state = await this.stateStore.readState();
    const purchase = Object.values(state.creditPurchases).find(
      (item) => item.correlationId === correlationId,
    );
    return purchase ? this.toCreditPurchase(purchase) : null;
  }

  async updateCreditPurchaseStatus(
    id: string,
    status: CreditPurchaseStatus,
    failureReason?: string | null,
    stripePaymentIntentId?: string | null,
  ): Promise<CreditPurchase> {
    return this.stateStore.runStateTransaction((state) => {
      const purchase = state.creditPurchases[id];
      if (!purchase) {
        throw new Error('CREDIT_PURCHASE_NOT_FOUND');
      }
      const updated: FirebaseCreditPurchaseRecord = {
        ...purchase,
        status,
        failureReason: failureReason ?? null,
        stripePaymentIntentId: stripePaymentIntentId ?? null,
        updatedAt: nowIso(),
      };
      state.creditPurchases[id] = updated;
      return this.toCreditPurchase(updated);
    });
  }

  async listUserCreditTransactions(
    userId: string,
    params: PaginationParams,
  ): Promise<{ items: CreditTransaction[]; total: number }> {
    const state = await this.stateStore.readState();
    const matching = Object.values(state.creditTransactions).filter(
      (item) => item.userId === userId,
    );
    const paginated = paginateDescendingByCreatedAt(matching, params);
    return {
      items: paginated.items.map((item) => this.toCreditTransaction(item)),
      total: paginated.total,
    };
  }

  async listUserCreditPurchases(
    userId: string,
    params: PaginationParams,
  ): Promise<{ items: CreditPurchase[]; total: number }> {
    const state = await this.stateStore.readState();
    const matching = Object.values(state.creditPurchases).filter(
      (item) => item.userId === userId,
    );
    const paginated = paginateDescendingByCreatedAt(matching, params);
    return {
      items: paginated.items.map((item) => this.toCreditPurchase(item)),
      total: paginated.total,
    };
  }

  async adjustUserCredits(
    input: AdjustCreditsInput,
  ): Promise<CreditTransaction> {
    return this.stateStore.runStateTransaction((state) => {
      if (input.correlationId) {
        const existing = Object.values(state.creditTransactions).find(
          (transaction) =>
            transaction.userId === input.userId &&
            transaction.correlationId === input.correlationId,
        );
        if (existing) {
          return this.toCreditTransaction(existing);
        }
      }

      const user = state.users[input.userId];
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const balanceBefore = user.creditsBalance;
      const balanceAfter = balanceBefore + input.amount;
      if (balanceAfter < 0) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      user.creditsBalance = balanceAfter;
      user.updatedAt = nowIso();
      state.users[user.id] = user;

      const record: FirebaseCreditTransactionRecord = {
        id: createUuid(),
        userId: input.userId,
        type: input.type,
        amount: input.amount,
        balanceBefore,
        balanceAfter,
        description: input.description ?? null,
        correlationId: input.correlationId ?? null,
        metadata: input.metadata ? toPlainRecord(input.metadata) : null,
        createdAt: nowIso(),
      };
      state.creditTransactions[record.id] = record;
      return this.toCreditTransaction(record);
    });
  }

  async getUserCreditsBalance(userId: string): Promise<number> {
    const state = await this.stateStore.readState();
    const user = state.users[userId];
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    return user.creditsBalance;
  }

  async markFirstApprovedCreditPurchaseDone(userId: string): Promise<boolean> {
    return this.stateStore.runStateTransaction((state) => {
      const user = state.users[userId];
      if (!user || user.firstApprovedCreditPurchaseDone) {
        return false;
      }
      user.firstApprovedCreditPurchaseDone = true;
      user.updatedAt = nowIso();
      state.users[userId] = user;
      return true;
    });
  }

  async findOutboxEventsReadyToDispatch(
    batchSize: number,
    referenceDate: Date,
  ): Promise<CreditPurchaseOutbox[]> {
    const state = await this.stateStore.readState();
    return Object.values(state.creditPurchaseOutbox)
      .filter((event) => this.isCreditOutboxReady(event, referenceDate))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, batchSize)
      .map((event) => this.toCreditOutbox(event));
  }

  async markOutboxEventAsSent(eventId: string): Promise<void> {
    await this.stateStore.runStateTransaction((state) => {
      const existing = state.creditPurchaseOutbox[eventId];
      if (!existing) {
        return;
      }
      state.creditPurchaseOutbox[eventId] = {
        ...existing,
        status: CreditPurchaseOutboxStatus.SENT,
        publishedAt: nowIso(),
        nextAttemptAt: null,
        lastError: null,
        updatedAt: nowIso(),
      };
    });
  }

  async markOutboxEventForRetry(
    eventId: string,
    status: CreditPurchaseOutboxStatus,
    attempts: number,
    nextAttemptAt: Date | null,
    lastError: string | null,
  ): Promise<void> {
    await this.stateStore.runStateTransaction((state) => {
      const existing = state.creditPurchaseOutbox[eventId];
      if (!existing) {
        return;
      }
      state.creditPurchaseOutbox[eventId] = {
        ...existing,
        status,
        attempts,
        nextAttemptAt: nextAttemptAt ? nextAttemptAt.toISOString() : null,
        lastError: lastError ?? null,
        updatedAt: nowIso(),
      };
    });
  }

  async findReferralRewardLog(
    referrerUserId: string,
    refereeUserId: string,
    rewardType: ReferralRewardType,
  ): Promise<ReferralRewardLog | null> {
    const state = await this.stateStore.readState();
    const reward = Object.values(state.referralRewardLogs).find(
      (item) =>
        item.referrerUserId === referrerUserId &&
        item.refereeUserId === refereeUserId &&
        item.rewardType === String(rewardType),
    );
    return reward ? this.toReferralRewardLog(reward) : null;
  }

  async createReferralRewardLog(input: {
    referrerUserId: string;
    refereeUserId: string;
    rewardType: ReferralRewardType;
    creditsGranted: number;
    correlationId?: string;
  }): Promise<ReferralRewardLog> {
    return this.stateStore.runStateTransaction((state) => {
      const record: FirebaseReferralRewardLogRecord = {
        id: createUuid(),
        referrerUserId: input.referrerUserId,
        refereeUserId: input.refereeUserId,
        rewardType: input.rewardType,
        creditsGranted: input.creditsGranted,
        correlationId: input.correlationId ?? null,
        createdAt: nowIso(),
      };
      state.referralRewardLogs[record.id] = record;
      return this.toReferralRewardLog(record);
    });
  }

  private createDefaultCreditSystemConfig(): FirebaseCreditSystemConfigRecord {
    const timestamp = nowIso();
    return {
      id: CREDIT_SYSTEM_CONFIG_ID,
      registrationBonusCredits: 250,
      referralEnabled: true,
      refereeRegistrationBonusCredits: 50,
      referrerFirstPurchaseBonusCredits: 100,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  private isCreditOutboxReady(
    event: FirebaseCreditPurchaseOutboxRecord,
    referenceDate: Date,
  ): boolean {
    if (event.status === String(CreditPurchaseOutboxStatus.PENDING)) {
      return true;
    }
    if (event.status !== String(CreditPurchaseOutboxStatus.FAILED)) {
      return false;
    }
    if (!event.nextAttemptAt) {
      return true;
    }
    return toDate(event.nextAttemptAt).getTime() <= referenceDate.getTime();
  }

  private toCreditPlan(record: FirebaseCreditPlanRecord): CreditPlan {
    return {
      id: record.id,
      name: record.name,
      creditsAmount: record.creditsAmount,
      priceBrl: record.priceBrl,
      isActive: record.isActive,
      createdAt: toDate(record.createdAt),
      updatedAt: toDate(record.updatedAt),
    };
  }

  private toCreditSystemConfig(
    record: FirebaseCreditSystemConfigRecord,
  ): CreditSystemConfig {
    return {
      id: record.id,
      registrationBonusCredits: record.registrationBonusCredits,
      referralEnabled: record.referralEnabled,
      refereeRegistrationBonusCredits: record.refereeRegistrationBonusCredits,
      referrerFirstPurchaseBonusCredits:
        record.referrerFirstPurchaseBonusCredits,
      createdAt: toDate(record.createdAt),
      updatedAt: toDate(record.updatedAt),
    };
  }

  private toCreditPurchase(
    record: FirebaseCreditPurchaseRecord,
  ): CreditPurchase {
    return {
      id: record.id,
      userId: record.userId,
      creditPlanId: record.creditPlanId,
      creditsAmount: record.creditsAmount,
      amountBrl: record.amountBrl,
      status: record.status as CreditPurchaseStatus,
      provider: record.provider,
      correlationId: record.correlationId,
      stripePaymentIntentId: record.stripePaymentIntentId,
      failureReason: record.failureReason,
      createdAt: toDate(record.createdAt),
      updatedAt: toDate(record.updatedAt),
    };
  }

  private toCreditOutbox(
    record: FirebaseCreditPurchaseOutboxRecord,
  ): CreditPurchaseOutbox {
    return {
      id: record.id,
      creditPurchaseId: record.creditPurchaseId,
      eventType: record.eventType,
      payload: record.payload,
      status: record.status as CreditPurchaseOutboxStatus,
      attempts: record.attempts,
      nextAttemptAt: record.nextAttemptAt ? toDate(record.nextAttemptAt) : null,
      lastError: record.lastError,
      publishedAt: record.publishedAt ? toDate(record.publishedAt) : null,
      createdAt: toDate(record.createdAt),
      updatedAt: toDate(record.updatedAt),
    };
  }

  private toCreditTransaction(
    record: FirebaseCreditTransactionRecord,
  ): CreditTransaction {
    return {
      id: record.id,
      userId: record.userId,
      type: record.type as CreditTransactionType,
      amount: record.amount,
      balanceBefore: record.balanceBefore,
      balanceAfter: record.balanceAfter,
      description: record.description,
      correlationId: record.correlationId,
      metadata: record.metadata,
      createdAt: toDate(record.createdAt),
    };
  }

  private toReferralRewardLog(
    record: FirebaseReferralRewardLogRecord,
  ): ReferralRewardLog {
    return {
      id: record.id,
      referrerUserId: record.referrerUserId,
      refereeUserId: record.refereeUserId,
      rewardType: record.rewardType as ReferralRewardType,
      creditsGranted: record.creditsGranted,
      correlationId: record.correlationId,
      createdAt: toDate(record.createdAt),
    };
  }
}
