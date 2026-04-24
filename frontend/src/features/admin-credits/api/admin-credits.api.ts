import { apiClient } from '@/shared/api/apiClient';
import type {
  CreditPlan,
  CreditSystemConfig,
  PaginatedResponse,
  PaginationParams,
} from '@/entities/credit/model/types';

interface CreateCreditPlanPayload {
  name: string;
  creditsAmount: number;
  priceBrl: number;
  isActive: boolean;
}

interface UpdateCreditPlanPayload {
  name?: string;
  creditsAmount?: number;
  priceBrl?: number;
  isActive?: boolean;
}

interface UpdateCreditConfigPayload {
  registrationBonusCredits?: number;
  referralEnabled?: boolean;
  refereeRegistrationBonusCredits?: number;
  referrerFirstPurchaseBonusCredits?: number;
}

export const adminCreditsApi = {
  getPlans: async (
    params?: PaginationParams,
  ): Promise<PaginatedResponse<CreditPlan>> => {
    const { data } = await apiClient.get<PaginatedResponse<CreditPlan>>(
      '/admin/credits/plans',
      { params },
    );
    return data;
  },

  createPlan: async (payload: CreateCreditPlanPayload): Promise<CreditPlan> => {
    const { data } = await apiClient.post<CreditPlan>(
      '/admin/credits/plans',
      payload,
    );
    return data;
  },

  updatePlan: async (
    id: string,
    payload: UpdateCreditPlanPayload,
  ): Promise<CreditPlan> => {
    const { data } = await apiClient.patch<CreditPlan>(
      `/admin/credits/plans/${id}`,
      payload,
    );
    return data;
  },

  deletePlan: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(
      `/admin/credits/plans/${id}`,
    );
    return data;
  },

  getConfig: async (): Promise<CreditSystemConfig> => {
    const { data } = await apiClient.get<CreditSystemConfig>(
      '/admin/credits/config',
    );
    return data;
  },

  updateConfig: async (
    payload: UpdateCreditConfigPayload,
  ): Promise<CreditSystemConfig> => {
    const { data } = await apiClient.patch<CreditSystemConfig>(
      '/admin/credits/config',
      payload,
    );
    return data;
  },
};
