import { apiClient } from '../../../shared/api/apiClient';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from '../model/types';

export const authApi = {
  login: async (credentials: LoginPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return data;
  },
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    return data;
  },
  refresh: async (): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh');
    return data;
  },
  me: async (): Promise<AuthResponse> => {
    const { data } = await apiClient.get<AuthResponse>('/auth/me');
    return data;
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
