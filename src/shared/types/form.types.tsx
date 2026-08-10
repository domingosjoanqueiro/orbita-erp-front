// src/shared/types/form.types.ts
import { FieldError, Merge, FieldErrorsImpl } from 'react-hook-form';

export type FormError = string | FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined;

export function getErrorMessage(error: FormError): string | undefined {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return error.message as string;
  }
  return undefined;
}

// Tipo para validação de formulários
export type ValidationError = {
  field: string;
  message: string;
};

export type FormState<T = any> = {
  data: T | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
};