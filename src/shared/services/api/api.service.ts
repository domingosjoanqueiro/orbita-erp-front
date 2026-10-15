import { api, apiClient } from './client';

export interface ApiServiceOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export type ID = string | number;

/*
 * Os filtros do frontend usam "isActive", mas a maioria das listagens da API
 * lê o estado no parâmetro "status" (anos letivos lê "isActive").
 * Envia-se ambos para que o filtro de estado funcione em todos os módulos.
 */
function normalizeListParams(
  params?: Record<string, any>
): Record<string, any> | undefined {
  if (!params || params.isActive === undefined || params.status !== undefined) {
    return params;
  }
  return { ...params, status: params.isActive };
}

export class ApiService {

  protected authType: 'platform' | 'company' = 'company';

  constructor(
    authType?: 'platform' | 'company'
  ) {

    if (authType) {

      this.authType = authType;

    }

  }

  private prepareAuth() {

    apiClient.setAuthType(
      this.authType
    );

  }

  protected async get<T>(
    url: string,
    options?: ApiServiceOptions
  ): Promise<T> {

    this.prepareAuth();

    const response =
      await api.get(
        url,
        {
          ...options,
          params: normalizeListParams(options?.params),
        }
      );

    return response.data;

  }

  protected async post<T>(
    url: string,
    data?: any,
    options?: ApiServiceOptions
  ): Promise<T> {

    this.prepareAuth();

    const response =
      await api.post(
        url,
        data,
        options
      );

    return response.data;

  }

  protected async put<T>(
    url: string,
    data?: any,
    options?: ApiServiceOptions
  ): Promise<T> {

    this.prepareAuth();

    const response =
      await api.put(
        url,
        data,
        options
      );

    return response.data;

  }

  protected async patch<T>(
    url: string,
    data?: any,
    options?: ApiServiceOptions
  ): Promise<T> {

    this.prepareAuth();

    const response =
      await api.patch(
        url,
        data,
        options
      );

    return response.data;

  }

  protected async delete<T>(
    url: string,
    options?: ApiServiceOptions
  ): Promise<T> {

    this.prepareAuth();

    const response =
      await api.delete(
        url,
        options
      );

    return response.data;

  }

  setAuthType(
    type: 'platform' | 'company'
  ) {

    this.authType = type;

    apiClient.setAuthType(
      type
    );

  }

}