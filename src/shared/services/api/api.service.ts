import { api, apiClient } from './client';

export interface ApiServiceOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export type ID = string | number;

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
        options
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