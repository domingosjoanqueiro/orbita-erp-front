'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoading } from '@/shared/contexts/LoadingContext';

export function RouteLoading() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    // Quando a rota mudar, mostrar loading
    const handleRouteChange = () => {
      startLoading();
    };

    // Quando a rota terminar de carregar, esconder loading
    const handleRouteComplete = () => {
      // Pequeno delay para garantir que a página foi renderizada
      setTimeout(() => {
        stopLoading();
      }, 100);
    };

    // Iniciar loading quando a URL mudar
    if (pathname) {
      handleRouteChange();
      handleRouteComplete();
    }

    return () => {
      stopLoading();
    };
  }, [pathname, searchParams, startLoading, stopLoading]);

  return null;
}