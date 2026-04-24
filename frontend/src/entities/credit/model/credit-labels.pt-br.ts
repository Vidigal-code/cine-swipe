import type {
  CreditPurchaseStatus,
  CreditTransactionType,
} from './types';

const CREDIT_TRANSACTION_TYPE_LABELS: Record<CreditTransactionType, string> = {
  REGISTRATION_BONUS: 'Bônus de cadastro',
  REFEREE_REGISTRATION_BONUS: 'Bônus por indicação (indicado)',
  REFERRER_FIRST_PURCHASE_BONUS: 'Bônus por indicação (indicador)',
  CREDIT_PURCHASE: 'Compra de créditos',
  CREDIT_CONSUMPTION: 'Consumo de créditos',
  ADMIN_ADJUSTMENT: 'Ajuste administrativo',
};

const CREDIT_PURCHASE_STATUS_LABELS: Record<CreditPurchaseStatus, string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluído',
  FAILED: 'Falhou',
};

export function resolveCreditTransactionTypeLabel(type: string): string {
  if (isKnownCreditTransactionType(type)) {
    return CREDIT_TRANSACTION_TYPE_LABELS[type];
  }
  return 'Movimentação de créditos';
}

export function resolveCreditPurchaseStatusLabel(
  status: CreditPurchaseStatus,
): string {
  return CREDIT_PURCHASE_STATUS_LABELS[status];
}

function isKnownCreditTransactionType(
  value: string,
): value is CreditTransactionType {
  return value in CREDIT_TRANSACTION_TYPE_LABELS;
}
