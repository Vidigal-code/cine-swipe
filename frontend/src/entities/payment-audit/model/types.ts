import { PaginatedResponse, PaginationParams } from '@/entities/movie/model/types';

export type PaymentAuditStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface PaymentAudit {
  id: string;
  purchaseId: string;
  userId: string;
  userName: string;
  userEmail: string;
  movieId: string;
  movieTitle: string;
  amount: number;
  provider: string;
  status: PaymentAuditStatus;
  correlationId: string;
  stripePaymentIntentId: string | null;
  eventType: string;
  source: string;
  message: string | null;
  createdAt: string;
}

export type PaymentAuditPaginationParams = PaginationParams;
export type PaymentAuditPaginatedResponse = PaginatedResponse<PaymentAudit>;
