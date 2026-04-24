'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { authApi } from '../api/auth.api';
import { hydrateAuth, loginSuccess, logout, setHydrated } from '../model/authSlice';
import type { AppDispatch } from '@/shared/store/store';

export function AuthBootstrap() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const me = await authApi.me();
        if (!isMounted) {
          return;
        }
        dispatch(hydrateAuth({ user: me.user }));
        return;
      } catch {
        // Attempt one refresh using HttpOnly cookie
      }

      try {
        const refreshed = await authApi.refresh();
        if (!isMounted) {
          return;
        }
        dispatch(loginSuccess(refreshed));
      } catch {
        if (!isMounted) {
          return;
        }
        dispatch(logout());
        dispatch(setHydrated());
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  return null;
}
