import type { UserInfo } from './types';

export const USER_ROLES = {
  admin: 'ADMIN',
  user: 'USER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === USER_ROLES.admin;
}

export function isAdminUser(
  user: Pick<UserInfo, 'role'> | null | undefined,
): boolean {
  return isAdminRole(user?.role);
}
