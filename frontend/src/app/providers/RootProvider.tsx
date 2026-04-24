'use client';

import React, { useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '../../shared/store/store';
import { ThemeProvider } from 'next-themes';
import { START_THEME } from '@/shared/config/theme';
import { AuthBootstrap } from '@/features/auth/ui/AuthBootstrap';

export function RootProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={START_THEME}
      enableSystem={false}
      storageKey="cine-swipe-theme"
    >
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthBootstrap />
          {children}
        </QueryClientProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
