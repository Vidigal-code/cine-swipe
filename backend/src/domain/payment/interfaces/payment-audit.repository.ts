import {
  CreatePaymentAuditInput,
  PaymentAudit,
} from '../entities/payment-audit.entity';
import { PaginationParams } from '../../../shared/pagination/pagination.types';

export const PAYMENT_AUDIT_REPOSITORY = 'PAYMENT_AUDIT_REPOSITORY';

export interface IPaymentAuditRepository {
  create(input: CreatePaymentAuditInput): Promise<PaymentAudit>;
  findPage(
    params: PaginationParams,
  ): Promise<{ items: PaymentAudit[]; total: number }>;
}
