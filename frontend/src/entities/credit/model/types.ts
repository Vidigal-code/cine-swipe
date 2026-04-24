import type { PaginationMeta } from '@/entities/movie/model/types';

export type CreditTransactionType =
  | 'REGISTRATION_BONUS'
  | 'REFEREE_REGISTRATION_BONUS'
  | 'REFERRER_FIRST_PURCHASE_BONUS'
  | 'CREDIT_PURCHASE'
  | 'CREDIT_CONSUMPTION'
  | 'ADMIN_ADJUSTMENT';

export type CreditPurchaseStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface CreditPlan {
  id: string;
  name: string;
  creditsAmount: number;
  priceBrl: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditSystemConfig {
  id: number;
  registrationBonusCredits: number;
  referralEnabled: boolean;
  refereeRegistrationBonusCredits: number;
  referrerFirstPurchaseBonusCredits: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface CreditPurchase {
  id: string;
  userId: string;
  creditPlanId: string;
  creditsAmount: number;
  amountBrl: number;
  status: CreditPurchaseStatus;
  provider: string;
  correlationId: string;
  stripePaymentIntentId: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CreditBalanceResponse {
  balance: number;
}
