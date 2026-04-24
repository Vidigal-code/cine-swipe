import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthResponse, UserInfo } from './types';

interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  isHydrated: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isHydrated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<AuthResponse>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.isHydrated = true;
    },
    hydrateAuth: (state, action: PayloadAction<{ user: UserInfo | null }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = Boolean(action.payload.user);
      state.isHydrated = true;
    },
    setHydrated: (state) => {
      state.isHydrated = true;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.isHydrated = true;
    },
  },
});

export const { loginSuccess, hydrateAuth, setHydrated, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
