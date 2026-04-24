export enum PaymentOutboxStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export class PaymentOutbox {
  id!: string;
  purchaseId!: string;
  eventType!: string;
  payload!: Record<string, unknown>;
  status!: PaymentOutboxStatus;
  attempts!: number;
  nextAttemptAt!: Date | null;
  lastError!: string | null;
  publishedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export interface CreateOutboxEventInput {
  eventType: string;
  payload: Record<string, unknown>;
}
