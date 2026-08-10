import { ApiService } from '../api/api.service';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    mustChangePassword: number;
    company: {
      id: number;
      uuid: string;
      name: string;
    };
    user: {
      id: number;
      uuid: string;
      firstName: string;
      lastName: string;
      email: string;
      username: string;
    };
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class AuthService extends ApiService {
  private basePath = '/auth';

  constructor() {
    super('company');
  }

  

  async login(data: LoginRequest): Promise<LoginResponse> {
    console.log('📤 AuthService.login chamado com:', data);
    try {
      const response = await this.post<LoginResponse>(`${this.basePath}/login`, data);
      console.log('📥 AuthService.login resposta:', response);
      return response;
    } catch (error) {
      console.error('❌ AuthService.login erro:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return this.post<RefreshTokenResponse>(`${this.basePath}/refresh`, { refreshToken });
  }

  async changePassword(data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> {
    console.log(
    "📤 CHANGE PASSWORD PAYLOAD:",
    data
  );
    return this.post<{ success: boolean; message: string }>(`${this.basePath}/change-password`, data);
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>(`${this.basePath}/logout`);
  }

  async me(): Promise<any> {
    return this.get<any>(`${this.basePath}/me`);
  }
}

export const authService = new AuthService();