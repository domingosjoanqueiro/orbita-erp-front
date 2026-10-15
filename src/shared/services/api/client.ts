import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/shared/config/env';

const API_URL = env.api.url;
const API_TIMEOUT = env.api.timeout;

// Chaves para diferentes tipos de autenticação
export const TOKEN_KEYS = {
    platform: 'platformAccessToken',
    platformRefresh: 'platformRefreshToken',
    company: 'accessTokenorbitavisionapi@2026',
    companyRefresh: 'refreshTokenorbitavisionapi@2026',

} as const;

export type AuthType = 'platform' | 'company';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class ApiClient {
  private client: AxiosInstance;
  private authType: AuthType = 'company';

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-App-Version': env.app.version,
      },
      timeout: API_TIMEOUT,
    });

    this.setupInterceptors();
  }

  // Definir o tipo de autenticação
  setAuthType(type: AuthType) {
    this.authType = type;
  }

  getAuthType(): AuthType {
    return this.authType;
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        const refreshPath = this.authType === 'platform'
          ? '/system/auth/refresh'
          : '/auth/refresh';
        // Um 401 do próprio pedido de renovação não pode disparar nova renovação
        const isRefreshRequest = typeof originalRequest?.url === 'string'
          && originalRequest.url.includes(refreshPath);

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshRequest) {
          originalRequest._retry = true;
          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.client.post(refreshPath, { refreshToken });
              // A API responde { success, message, data: { accessToken, refreshToken } }
              const tokens = response.data?.data ?? response.data;
              const accessToken: string | undefined = tokens?.accessToken;
              if (!accessToken) {
                throw new Error('Resposta de renovação de sessão inválida');
              }
              this.setAccessToken(accessToken);
              if (tokens.refreshToken) {
                this.setRefreshToken(tokens.refreshToken);
              }
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            if (typeof window !== 'undefined') {
              const loginPath = this.authType === 'platform' 
                ? '/platform-login' 
                : '/login';
              window.location.href = loginPath;
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      const key = this.authType === 'platform' 
        ? TOKEN_KEYS.platform 
        : TOKEN_KEYS.company;
      return localStorage.getItem(key);
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      const key = this.authType === 'platform' 
        ? TOKEN_KEYS.platformRefresh 
        : TOKEN_KEYS.companyRefresh;
      return localStorage.getItem(key);
    }
    return null;
  }

  private setAccessToken(token: string): void {
    if (typeof window !== 'undefined') {
      const key = this.authType === 'platform'
        ? TOKEN_KEYS.platform
        : TOKEN_KEYS.company;
      localStorage.setItem(key, token);
      // O middleware do Next valida a sessão pelo cookie
      document.cookie = `${key}=${token}; path=/; max-age=3600; SameSite=Lax`;
    }
  }

  private setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      const key = this.authType === 'platform'
        ? TOKEN_KEYS.platformRefresh
        : TOKEN_KEYS.companyRefresh;
      localStorage.setItem(key, token);
      document.cookie = `${key}=${token}; path=/; max-age=604800; SameSite=Lax`;
    }
  }

  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      const tokenKey = this.authType === 'platform' 
        ? TOKEN_KEYS.platform 
        : TOKEN_KEYS.company;
      const refreshKey = this.authType === 'platform' 
        ? TOKEN_KEYS.platformRefresh 
        : TOKEN_KEYS.companyRefresh;
      
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(refreshKey);
      localStorage.removeItem(env.auth.userKey);
    }
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export const api = apiClient.getClient();