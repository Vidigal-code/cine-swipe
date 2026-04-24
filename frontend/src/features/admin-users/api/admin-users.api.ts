import { apiClient } from '@/shared/api/apiClient';
import type {
  AdminUserRecord,
  AdminUsersPaginatedResponse,
  AdminUsersPaginationParams,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
  UpdateAdminUserRolePayload,
} from '../model/admin-users.types';

export const adminUsersApi = {
  getUsers: async (
    params: AdminUsersPaginationParams,
  ): Promise<AdminUsersPaginatedResponse> => {
    const { data } = await apiClient.get<AdminUsersPaginatedResponse>('/admin/users', {
      params,
    });
    return data;
  },

  createUser: async (payload: CreateAdminUserPayload): Promise<AdminUserRecord> => {
    const { data } = await apiClient.post<AdminUserRecord>('/admin/users', payload);
    return data;
  },

  updateUser: async (
    id: string,
    payload: UpdateAdminUserPayload,
  ): Promise<AdminUserRecord> => {
    const { data } = await apiClient.patch<AdminUserRecord>(
      `/admin/users/${id}`,
      payload,
    );
    return data;
  },

  updateUserRole: async (
    id: string,
    payload: UpdateAdminUserRolePayload,
  ): Promise<AdminUserRecord> => {
    const { data } = await apiClient.patch<AdminUserRecord>(
      `/admin/users/${id}/role`,
      payload,
    );
    return data;
  },

  deleteUser: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/admin/users/${id}`);
    return data;
  },
};
