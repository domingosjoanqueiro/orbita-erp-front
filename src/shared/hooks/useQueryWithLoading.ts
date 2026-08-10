import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useEffect } from 'react';

export function useQueryWithLoading<TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError>
): UseQueryResult<TData, TError> & { isLoading: boolean } {
  const { startLoading, stopLoading } = useLoading();
  
  const queryResult = useQuery({
    ...options,
  });

  const { isLoading, isFetching } = queryResult;

  useEffect(() => {
    if (isFetching) {
      startLoading();
    } else {
      stopLoading();
    }
  }, [isFetching, startLoading, stopLoading]);

  // spread as any to avoid TypeScript narrowing conflict on isLoading
  const enhanced = {
    ...(queryResult as any),
    isLoading: isLoading || isFetching,
  } as UseQueryResult<TData, TError> & { isLoading: boolean };

  return enhanced;
}