import type { RootState } from '@/shared/store/store';
import { isAdminUser } from './auth.roles';

export const selectAuthState = (state: RootState) => state.auth;

export const selectAuthUser = (state: RootState) => selectAuthState(state).user;

export const selectIsAdmin = (state: RootState) =>
  isAdminUser(selectAuthUser(state));
