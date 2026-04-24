import { apiClient } from '@/shared/api/apiClient';
import type { AuthResponse } from '@/features/auth/model/types';

interface UpdateProfilePayload {
  username?: string;
  email?: string;
}

interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = {
  updateProfile: async (payload: UpdateProfilePayload): Promise<AuthResponse> => {
    const { data } = await apiClient.put<AuthResponse>('/auth/profile', payload);
    return data;
  },

  updatePassword: async (
    payload: UpdatePasswordPayload,
  ): Promise<{ success: boolean }> => {
    const { data } = await apiClient.put<{ success: boolean }>(
      '/auth/password',
      payload,
    );
    return data;
  },

  uploadAvatar: async (file: File): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<AuthResponse>('/auth/avatar/upload', formData);
    return data;
  },
};
