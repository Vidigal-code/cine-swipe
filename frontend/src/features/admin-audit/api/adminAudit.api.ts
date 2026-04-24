import { apiClient } from '@/shared/api/apiClient';
import {
  PaymentAuditPaginatedResponse,
  PaymentAuditPaginationParams,
} from '@/entities/payment-audit/model/types';

export const adminAuditApi = {
  getPaymentAudits: async (
    params?: PaymentAuditPaginationParams,
  ): Promise<PaymentAuditPaginatedResponse> => {
    const { data } = await apiClient.get<PaymentAuditPaginatedResponse>(
      '/payments/admin/audits',
      { params },
    );
    return data;
  },
};
