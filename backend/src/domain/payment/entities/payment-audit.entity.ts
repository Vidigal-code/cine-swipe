import { PurchaseStatus } from './purchase.entity';

export enum PaymentAuditEventType {
  CHECKOUT_REQUESTED = 'CHECKOUT_REQUESTED',
  STATUS_UPDATED = 'STATUS_UPDATED',
  RETRY_SCHEDULED = 'RETRY_SCHEDULED',
  DLQ_MOVED = 'DLQ_MOVED',
  WEBHOOK_DUPLICATE_IGNORED = 'WEBHOOK_DUPLICATE_IGNORED',
}

export enum PaymentAuditSource {
  API = 'API',
  WORKER = 'WORKER',
  WEBHOOK = 'WEBHOOK',
  SYSTEM = 'SYSTEM',
}

export class PaymentAudit {
  id!: string;
  purchaseId!: string;
  userId!: string;
  userName!: string;
  userEmail!: string;
  movieId!: string;
  movieTitle!: string;
  amount!: number;
  provider!: string;
  status!: PurchaseStatus;
  correlationId!: string;
  stripePaymentIntentId!: string | null;
  eventType!: PaymentAuditEventType;
  source!: PaymentAuditSource;
  message!: string | null;
  createdAt!: Date;
}

export interface CreatePaymentAuditInput {
  purchaseId: string;
  userId: string;
  userName: string;
  userEmail: string;
  movieId: string;
  movieTitle: string;
  amount: number;
  provider: string;
  status: PurchaseStatus;
  correlationId: string;
  stripePaymentIntentId?: string | null;
  eventType: PaymentAuditEventType;
  source: PaymentAuditSource;
  message?: string | null;
}
