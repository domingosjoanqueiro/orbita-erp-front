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