import { apiClient } from '@/shared/api/apiClient';
import type {
  CreditBalanceResponse,
  CreditPlan,
  CreditPurchase,
  CreditTransaction,
  PaginatedResponse,
  PaginationParams,
} from '@/entities/credit/model/types';

interface CheckoutPayload {
  creditPlanId: string;
}

interface ConsumePayload {
  amount: number;
  description: string;
  correlationId?: string;
}

export const creditsApi = {
  getBalance: async (): Promise<CreditBalanceResponse> => {
    const { data } = await apiClient.get<CreditBalanceResponse>('/credits/balance');
    return data;
  },

  getPlans: async (
    params?: PaginationParams,
  ): Promise<PaginatedResponse<CreditPlan>> => {
    const { data } = await apiClient.get<PaginatedResponse<CreditPlan>>(
      '/credits/plans',
      { params },
    );
    return data;
  },

  getHistory: async (
    params?: PaginationParams,
  ): Promise<PaginatedResponse<CreditTransaction>> => {
    const { data } = await apiClient.get<PaginatedResponse<CreditTransaction>>(
      '/credits/history',
      { params },
    );
    return data;
  },

  getPurchases: async (
    params?: PaginationParams,
  ): Promise<PaginatedResponse<CreditPurchase>> => {
    const { data } = await apiClient.get<PaginatedResponse<CreditPurchase>>(
      '/credits/purchases',
      { params },
    );
    return data;
  },

  checkout: async (payload: CheckoutPayload): Promise<CreditPurchase> => {
    const { data } = await apiClient.post<CreditPurchase>(
      '/credits/checkout',
      payload,
    );
    return data;
  },

  consume: async (payload: ConsumePayload): Promise<{ success: boolean }> => {
    const { data } = await apiClient.post<{ success: boolean }>(
      '/credits/consume',
      payload,
    );
    return data;
  },
};
