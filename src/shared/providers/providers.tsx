'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import { AuthProvider } from '@/shared/contexts/AuthContext';
import { PlatformAuthProvider } from '@/shared/contexts/PlatformAuthContext';
import { CompanyProvider } from '@/shared/contexts/CompanyContext';
import { LoadingProvider } from '@/shared/contexts/LoadingContext';
import { ToastProvider } from '@/shared/contexts/ToastContext';
import { GlobalLoading } from '@/shared/components/ui/GlobalLoading/GlobalLoading';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LoadingProvider>
          <ToastProvider>
            <PlatformAuthProvider>
              <AuthProvider>  {/* AuthProvider está dentro do PlatformAuthProvider */}
                <CompanyProvider>
                  {children}
                  <GlobalLoading />
                </CompanyProvider>
              </AuthProvider>
            </PlatformAuthProvider>
          </ToastProvider>
        </LoadingProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}