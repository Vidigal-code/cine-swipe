import { Injectable } from '@nestjs/common';
import { IPurchaseRepository } from '../../../domain/payment/interfaces/purchase.repository';
import {
  Purchase,
  PurchaseStatus,
} from '../../../domain/payment/entities/purchase.entity';
import { PaginationParams } from '../../../shared/pagination/pagination.types';
import {
  CreateOutboxEventInput,
  PaymentOutbox,
  PaymentOutboxStatus,
} from '../../../domain/payment/entities/payment-outbox.entity';
import { FirebaseStateStoreService } from '../firebase-state-store.service';
import {
  createUuid,
  nowIso,
  paginateDescendingByCreatedAt,
  toDate,
  toPlainRecord,
} from '../firebase-state.utils';
import {
  FirebaseDataState,
  FirebasePaymentOutboxRecord,
  FirebasePurchaseRecord,
} from '../firebase-state.types';
import { UserRole } from '../../../domain/user/entities/user.entity';

@Injectable()
export class FirebasePurchaseRepository implements IPurchaseRepository {
  constructor(private readonly stateStore: FirebaseStateStoreService) {}

  async create(purchaseData: Partial<Purchase>): Promise<Purchase> {
    return this.stateStore.runStateTransaction((state) => {
      const purchase = this.buildPurchaseRecord(purchaseData);
      state.purchases[purchase.id] = purchase;
      return this.toDomain(state, purchase);
    });
  }

  async createWithOutbox(
    purchaseData: Partial<Purchase>,
    outbox: CreateOutboxEventInput,
  ): Promise<Purchase> {
    return this.stateStore.runStateTransaction((state) => {
      const purchase = this.buildPurchaseRecord(purchaseData);
      state.purchases[purchase.id] = purchase;

      const outboxId = createUuid();
      const timestamp = nowIso();
      state.paymentOutbox[outboxId] = {
        id: outboxId,
        purchaseId: purchase.id,
        eventType: outbox.eventType,
        payload: toPlainRecord(outbox.payload),
        status: PaymentOutboxStatus.PENDING,
        attempts: 0,
        nextAttemptAt: null,
        lastError: null,
        publishedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      return this.toDomain(state, purchase);
    });
  }

  async findById(id: string): Promise<Purchase | null> {
    const state = await this.stateStore.readState();
    const purchase = state.purchases[id];
    return purchase ? this.toDomain(state, purchase) : null;
  }

  async updateStatus(id: string, status: PurchaseStatus): Promise<Purchase> {
    return this.updatePaymentResult(id, status);
  }

  async updatePaymentResult(
    id: string,
    status: PurchaseStatus,
    failureReason?: string | null,
    stripePaymentIntentId?: string | null,
  ): Promise<Purchase> {
    return this.stateStore.runStateTransaction((state) => {
      const existing = state.purchases[id];
      if (!existing) {
        throw new Error('PURCHASE_NOT_FOUND');
      }
      const updated: FirebasePurchaseRecord = {
        ...existing,
        status,
        failureReason: failureReason ?? existing.failureReason ?? null,
        stripePaymentIntentId:
          stripePaymentIntentId ?? existing.stripePaymentIntentId ?? null,
        updatedAt: nowIso(),
      };
      state.purchases[id] = updated;
      return this.toDomain(state, updated);
    });
  }

  async findByUser(userId: string): Promise<Purchase[]> {
    const state = await this.stateStore.readState();
    return Object.values(state.purchases)
      .filter((purchase) => purchase.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((purchase) => this.toDomain(state, purchase));
  }

  async findByUserPage(
    userId: string,
    params: PaginationParams,
    status?: PurchaseStatus,
  ): Promise<{ items: Purchase[]; total: number }> {
    const state = await this.stateStore.readState();
    const matching = Object.values(state.purchases).filter(
      (purchase) =>
        purchase.userId === userId &&
        (!status || purchase.status === String(status)),
    );
    const paginated = paginateDescendingByCreatedAt(matching, params);
    return {
      items: paginated.items.map((purchase) => this.toDomain(state, purchase)),
      total: paginated.total,
    };
  }

  async findByCorrelationId(correlationId: string): Promise<Purchase | null> {
    const state = await this.stateStore.readState();
    const purchase = Object.values(state.purchases).find(
      (item) => item.correlationId === correlationId,
    );
    return purchase ? this.toDomain(state, purchase) : null;
  }

  async findOutboxEventsReadyToDispatch(
    batchSize: number,
    referenceDate: Date,
  ): Promise<PaymentOutbox[]> {
    const state = await this.stateStore.readState();
    return Object.values(state.paymentOutbox)
      .filter((event) => this.isReadyToDispatch(event, referenceDate))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, batchSize)
      .map((event) => this.toOutboxDomain(event));
  }

  async markOutboxEventAsSent(eventId: string): Promise<void> {
    await this.stateStore.runStateTransaction((state) => {
      const event = state.paymentOutbox[eventId];
      if (!event) {
        return;
      }
      state.paymentOutbox[eventId] = {
        ...event,
        status: PaymentOutboxStatus.SENT,
        publishedAt: nowIso(),
        nextAttemptAt: null,
        lastError: null,
        updatedAt: nowIso(),
      };
    });
  }

  async markOutboxEventForRetry(
    eventId: string,
    status: PaymentOutboxStatus,
    attempts: number,
    nextAttemptAt: Date | null,
    lastError: string | null,
  ): Promise<void> {
    await this.stateStore.runStateTransaction((state) => {
      const event = state.paymentOutbox[eventId];
      if (!event) {
        return;
      }
      state.paymentOutbox[eventId] = {
        ...event,
        status,
        attempts,
        nextAttemptAt: nextAttemptAt ? nextAttemptAt.toISOString() : null,
        lastError: lastError ?? null,
        updatedAt: nowIso(),
      };
    });
  }

  private buildPurchaseRecord(
    purchaseData: Partial<Purchase>,
  ): FirebasePurchaseRecord {
    const timestamp = nowIso();
    return {
      id: purchaseData.id ?? createUuid(),
      userId: purchaseData.userId ?? '',
      movieId: purchaseData.movieId ?? '',
      amount: purchaseData.amount ?? 0,
      status: purchaseData.status ?? PurchaseStatus.PENDING,
      provider: purchaseData.provider ?? 'mock',
      correlationId: purchaseData.correlationId ?? createUuid(),
      stripePaymentIntentId: purchaseData.stripePaymentIntentId ?? null,
      failureReason: purchaseData.failureReason ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  private toDomain(
    state: FirebaseDataState,
    purchase: FirebasePurchaseRecord,
  ): Purchase {
    const movie = state.movies[purchase.movieId];
    const user = state.users[purchase.userId];
    return {
      id: purchase.id,
      userId: purchase.userId,
      movieId: purchase.movieId,
      amount: purchase.amount,
      status: purchase.status as PurchaseStatus,
      provider: purchase.provider,
      correlationId: purchase.correlationId,
      stripePaymentIntentId: purchase.stripePaymentIntentId,
      failureReason: purchase.failureReason,
      createdAt: toDate(purchase.createdAt),
      updatedAt: toDate(purchase.updatedAt),
      movie: movie
        ? {
            id: movie.id,
            title: movie.title,
            synopsis: movie.synopsis,
            genre: movie.genre,
            price: movie.price,
            posterUrl: movie.posterUrl,
            trailerUrl: movie.trailerUrl,
            createdAt: toDate(movie.createdAt),
            updatedAt: toDate(movie.updatedAt),
          }
        : null,
      user: user
        ? {
            id: user.id,
            username: user.username,
            email: user.email,
            passwordHash: user.passwordHash,
            firebaseUid: user.firebaseUid,
            role: user.role as UserRole,
            creditsBalance: user.creditsBalance,
            avatarUrl: user.avatarUrl,
            referralCode: user.referralCode,
            referredByUserId: user.referredByUserId,
            firstApprovedCreditPurchaseDone:
              user.firstApprovedCreditPurchaseDone,
            referralSignupBonusGranted: user.referralSignupBonusGranted,
            createdAt: toDate(user.createdAt),
            updatedAt: toDate(user.updatedAt),
          }
        : null,
    };
  }

  private toOutboxDomain(event: FirebasePaymentOutboxRecord): PaymentOutbox {
    return {
      id: event.id,
      purchaseId: event.purchaseId,
      eventType: event.eventType,
      payload: event.payload,
      status: event.status as PaymentOutboxStatus,
      attempts: event.attempts,
      nextAttemptAt: event.nextAttemptAt ? toDate(event.nextAttemptAt) : null,
      lastError: event.lastError,
      publishedAt: event.publishedAt ? toDate(event.publishedAt) : null,
      createdAt: toDate(event.createdAt),
      updatedAt: toDate(event.updatedAt),
    };
  }

  private isReadyToDispatch(
    event: FirebasePaymentOutboxRecord,
    referenceDate: Date,
  ): boolean {
    if (event.status === String(PaymentOutboxStatus.PENDING)) {
      return true;
    }
    if (event.status !== String(PaymentOutboxStatus.FAILED)) {
      return false;
    }
    if (!event.nextAttemptAt) {
      return true;
    }
    return toDate(event.nextAttemptAt).getTime() <= referenceDate.getTime();
  }
}
