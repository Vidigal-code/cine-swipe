import { Purchase } from '../entities/purchase.entity';
import { PurchaseStatus } from '../entities/purchase.entity';
import { PaginationParams } from '../../../shared/pagination/pagination.types';
import {
  CreateOutboxEventInput,
  PaymentOutbox,
  PaymentOutboxStatus,
} from '../entities/payment-outbox.entity';

export const PURCHASE_REPOSITORY = 'PURCHASE_REPOSITORY';

export interface IPurchaseRepository {
  create(purchase: Partial<Purchase>): Promise<Purchase>;
  createWithOutbox(
    purchase: Partial<Purchase>,
    outbox: CreateOutboxEventInput,
  ): Promise<Purchase>;
  findById(id: string): Promise<Purchase | null>;
  updateStatus(id: string, status: PurchaseStatus): Promise<Purchase>;
  findByUser(userId: string): Promise<Purchase[]>;
  findByUserPage(
    userId: string,
    params: PaginationParams,
    status?: PurchaseStatus,
  ): Promise<{ items: Purchase[]; total: number }>;
  findByCorrelationId(correlationId: string): Promise<Purchase | null>;
  findOutboxEventsReadyToDispatch(
    batchSize: number,
    referenceDate: Date,
  ): Promise<PaymentOutbox[]>;
  markOutboxEventAsSent(eventId: string): Promise<void>;
  markOutboxEventForRetry(
    eventId: string,
    status: PaymentOutboxStatus,
    attempts: number,
    nextAttemptAt: Date | null,
    lastError: string | null,
  ): Promise<void>;
}
