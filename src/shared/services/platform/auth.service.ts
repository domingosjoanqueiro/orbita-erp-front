import { ApiService } from '../api/api.service';

export interface PlatformLoginRequest {
  identifier: string;
  password: string;
}

export interface PlatformLoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      uuid: string;
      firstName: string;
      lastName: string;
      email: string;
      username: string;
      isRoot: boolean;
      roles: {
        id: number;
        name: string;
        permissions: {
          id: number;
          code: string;
          name: string;
          module: string;
        }[];
      }[];
    };
  };
}

class PlatformAuthService extends ApiService {
  private basePath = '/system/auth';

  constructor() {
    super('platform'); // Define que este serviço usa autenticação da plataforma
  }

  async login(data: PlatformLoginRequest): Promise<PlatformLoginResponse> {
    return this.post<PlatformLoginResponse>(`${this.basePath}/login`, data);
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return this.post<{ accessToken: string; refreshToken: string }>(`${this.basePath}/refresh`, { refreshToken });
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.post<{ success: boolean; message: string }>(`${this.basePath}/logout`);
  }

  async me(): Promise<PlatformLoginResponse['data']['user']> {
    return this.get<PlatformLoginResponse['data']['user']>(`${this.basePath}/me`);
  }
}

export const platformAuthService = new PlatformAuthService();