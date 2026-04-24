export enum CreditTransactionType {
  REGISTRATION_BONUS = 'REGISTRATION_BONUS',
  REFEREE_REGISTRATION_BONUS = 'REFEREE_REGISTRATION_BONUS',
  REFERRER_FIRST_PURCHASE_BONUS = 'REFERRER_FIRST_PURCHASE_BONUS',
  CREDIT_PURCHASE = 'CREDIT_PURCHASE',
  CREDIT_CONSUMPTION = 'CREDIT_CONSUMPTION',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
}

export class CreditTransaction {
  id!: string;
  userId!: string;
  type!: CreditTransactionType;
  amount!: number;
  balanceBefore!: number;
  balanceAfter!: number;
  description!: string | null;
  correlationId!: string | null;
  metadata!: Record<string, unknown> | null;
  createdAt!: Date;
}
