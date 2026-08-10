import { ApiService, ID } from '../api/api.service';

export interface PlatformUser {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  isRoot: boolean;
  isActive: boolean;
  roles: {
    id: number;
    name: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  roleIds: number[];
}

export interface UpdatePlatformUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  isActive?: boolean;
  roleIds?: number[];
}

export interface PlatformUserFilters {
  search?: string;
  isActive?: boolean;
  isRoot?: boolean;
  page?: number;
  limit?: number;
}

class PlatformUsersService extends ApiService {
  private basePath = '/system/users';

  constructor() {
    super('platform');
  }

  async getAll(filters?: PlatformUserFilters): Promise<{ data: PlatformUser[]; total: number; page: number; limit: number }> {
    return this.get<{ data: PlatformUser[]; total: number; page: number; limit: number }>(`${this.basePath}`, { params: filters });
  }

  async getById(id: ID): Promise<PlatformUser> {
    return this.get<PlatformUser>(`${this.basePath}/${id}`);
  }

  async create(data: CreatePlatformUserRequest): Promise<PlatformUser> {
    return this.post<PlatformUser>(`${this.basePath}`, data);
  }

  async update(id: ID, data: UpdatePlatformUserRequest): Promise<PlatformUser> {
    return this.patch<PlatformUser>(`${this.basePath}/${id}`, data);
  }

  // CORRIGIDO: Usar 'remove' em vez de 'delete' para evitar conflito
  async remove(id: ID): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`${this.basePath}/${id}`);
  }

  async toggleActive(id: ID): Promise<PlatformUser> {
    return this.patch<PlatformUser>(`${this.basePath}/${id}/toggle-active`);
  }

  async resetPassword(id: ID): Promise<{ success: boolean; temporaryPassword: string }> {
    return this.post<{ success: boolean; temporaryPassword: string }>(`${this.basePath}/${id}/reset-password`);
  }

  async checkFirstUser(): Promise<{ hasUsers: boolean }> {
    return this.get<{ hasUsers: boolean }>(`${this.basePath}/check-first`);
  }
}

export const platformUsersService = new PlatformUsersService();