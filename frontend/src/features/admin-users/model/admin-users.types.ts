import type { PaginatedResponse, PaginationParams } from '@/entities/movie/model/types';
import type { UserRole } from '@/features/auth/model/auth.roles';

export type AdminUserRole = UserRole;

export interface AdminUserRecord {
  id: string;
  username: string;
  email: string;
  role: AdminUserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminUserPayload {
  username: string;
  email: string;
  password: string;
  role: AdminUserRole;
}

export interface UpdateAdminUserPayload {
  username?: string;
  email?: string;
}

export interface UpdateAdminUserRolePayload {
  role: AdminUserRole;
}

export type AdminUsersPaginatedResponse = PaginatedResponse<AdminUserRecord>;

export type AdminUsersPaginationParams = PaginationParams;
