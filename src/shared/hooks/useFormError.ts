import { FieldErrors, FieldError, Merge, FieldErrorsImpl } from 'react-hook-form';

type ErrorType = string | FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined;

export function useFormError() {
  const getErrorMessage = (error: ErrorType): string | undefined => {
    if (!error) return undefined;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      return error.message as string;
    }
    return undefined;
  };

  return { getErrorMessage };
}