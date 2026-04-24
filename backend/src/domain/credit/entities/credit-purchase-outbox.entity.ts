export enum CreditPurchaseOutboxStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export class CreditPurchaseOutbox {
  id!: string;
  creditPurchaseId!: string;
  eventType!: string;
  payload!: Record<string, unknown>;
  status!: CreditPurchaseOutboxStatus;
  attempts!: number;
  nextAttemptAt!: Date | null;
  lastError!: string | null;
  publishedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export interface CreateCreditOutboxEventInput {
  eventType: string;
  payload: Record<string, unknown>;
}
