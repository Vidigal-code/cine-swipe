import { Injectable } from '@nestjs/common';
import {
  CreatePaymentAuditInput,
  PaymentAudit,
  PaymentAuditEventType,
  PaymentAuditSource,
} from '../../../domain/payment/entities/payment-audit.entity';
import { PurchaseStatus } from '../../../domain/payment/entities/purchase.entity';
import { IPaymentAuditRepository } from '../../../domain/payment/interfaces/payment-audit.repository';
import { PaginationParams } from '../../../shared/pagination/pagination.types';
import { FirebaseStateStoreService } from '../firebase-state-store.service';
import {
  createUuid,
  nowIso,
  paginateDescendingByCreatedAt,
  toDate,
} from '../firebase-state.utils';
import { FirebasePaymentAuditRecord } from '../firebase-state.types';

@Injectable()
export class FirebasePaymentAuditRepository implements IPaymentAuditRepository {
  constructor(private readonly stateStore: FirebaseStateStoreService) {}

  async create(input: CreatePaymentAuditInput): Promise<PaymentAudit> {
    return this.stateStore.runStateTransaction((state) => {
      const record: FirebasePaymentAuditRecord = {
        id: createUuid(),
        purchaseId: input.purchaseId,
        userId: input.userId,
        userName: input.userName,
        userEmail: input.userEmail,
        movieId: input.movieId,
        movieTitle: input.movieTitle,
        amount: input.amount,
        provider: input.provider,
        status: input.status,
        correlationId: input.correlationId,
        stripePaymentIntentId: input.stripePaymentIntentId ?? null,
        eventType: input.eventType,
        source: input.source,
        message: input.message ?? null,
        createdAt: nowIso(),
      };
      state.paymentAudits[record.id] = record;
      return this.toDomain(record);
    });
  }

  async findPage(
    params: PaginationParams,
  ): Promise<{ items: PaymentAudit[]; total: number }> {
    const state = await this.stateStore.readState();
    const paginated = paginateDescendingByCreatedAt(
      Object.values(state.paymentAudits),
      params,
    );
    return {
      items: paginated.items.map((item) => this.toDomain(item)),
      total: paginated.total,
    };
  }

  private toDomain(record: FirebasePaymentAuditRecord): PaymentAudit {
    return {
      id: record.id,
      purchaseId: record.purchaseId,
      userId: record.userId,
      userName: record.userName,
      userEmail: record.userEmail,
      movieId: record.movieId,
      movieTitle: record.movieTitle,
      amount: record.amount,
      provider: record.provider,
      status: record.status as PurchaseStatus,
      correlationId: record.correlationId,
      stripePaymentIntentId: record.stripePaymentIntentId,
      eventType: record.eventType as PaymentAuditEventType,
      source: record.source as PaymentAuditSource,
      message: record.message,
      createdAt: toDate(record.createdAt),
    };
  }
}
