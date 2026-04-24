import type { UserRole } from './auth.roles';

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  creditsBalance?: number;
  avatarUrl?: string | null;
  referralCode?: string;
  referredByUserId?: string | null;
}

export interface AuthResponse {
  user: UserInfo;
}

export interface LoginPayload {
  email?: string;
  password?: string;
  firebaseIdToken?: string;
}

export interface RegisterPayload extends LoginPayload {
  username?: string;
  role?: UserRole;
  referralCode?: string;
}
