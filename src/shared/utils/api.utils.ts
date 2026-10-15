/**
 * Extrai os dados de uma resposta da API
 * Suporta: { success, message, data } ou o dado diretamente
 */
export function extractApiData<T>(response: any): T {
  if (!response) return {} as T;
  
  // Se a resposta tem a estrutura { success, message, data }
  if (response.data !== undefined) {
    return response.data;
  }
  
  // Se a resposta já é o dado
  return response;
}

interface ApiErrorShape {
  code?: string;
  response?: {
    data?: {
      message?: unknown;
      errors?: { fieldErrors?: unknown } | null;
    };
  };
}

/**
 * Mensagem de erro devolvida pela API ({ success: false, message, errors })
 */
export function getApiErrorMessage(error: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  const apiError = error as ApiErrorShape | undefined;
  const message = apiError?.response?.data?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (apiError?.code === 'ERR_NETWORK') return 'Não foi possível comunicar com o servidor.';
  return fallback;
}

/**
 * Erros por campo devolvidos pela API (formato zod flatten: { fieldErrors: { campo: [msg] } })
 */
export function getApiFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors = (error as ApiErrorShape | undefined)?.response?.data?.errors?.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== 'object') return {};
  return Object.fromEntries(
    Object.entries(fieldErrors as Record<string, unknown>)
      .filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
      .map(([field, messages]) => [field, String((messages as unknown[])[0])])
  );
}

/**
 * Extrai os dados de uma lista da API
 * Suporta: { data: { data: [], total: 0 } } ou { data: [], total: 0 } ou []
 */
export function extractApiList<T>(response: any): { data: T[]; total: number; page?: number; limit?: number; totalPages?: number } {
  if (!response) return { data: [], total: 0 };
  
  // Se a resposta tem a estrutura { data: { data: [], total: 0 } }
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    const innerData = response.data;
    return {
      data: innerData.data || [],
      total: innerData.total || 0,
      page: innerData.page,
      limit: innerData.limit,
      totalPages: innerData.totalPages,
    };
  }
  
  // Estrutura padrão da API: { data: [], meta: { page, limit, total, totalPages } }
  if (Array.isArray(response.data) && response.meta && typeof response.meta === 'object') {
    return {
      data: response.data,
      total: Number(response.meta.total ?? response.data.length),
      page: response.meta.page,
      limit: response.meta.limit,
      totalPages: response.meta.totalPages,
    };
  }

  // Se a resposta tem a estrutura { data: [], total: 0 }
  if (response.data && Array.isArray(response.data)) {
    return {
      data: response.data,
      total: response.total || response.data.length || 0,
    };
  }
  
  // Se a resposta é um array diretamente
  if (Array.isArray(response)) {
    return { data: response, total: response.length };
  }
  
  // Se a resposta tem a estrutura { data: [], total: 0 } (caso comum)
  if (response.data !== undefined) {
    return {
      data: response.data || [],
      total: response.total || 0,
    };
  }
  
  // Fallback
  return { data: [], total: 0 };
}