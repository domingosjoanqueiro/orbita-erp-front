import { ApiService } from '@/shared/services/api/api.service';
import type { 
  PlatformUser, 
  CreatePlatformUserRequest, 
  UpdatePlatformUserRequest,
  PlatformUserFilters 
} from '../types/platform-user.types';

class PlatformUsersService extends ApiService {
  private basePath = '/system/users';

  constructor() {
    super('platform');
  }

  async getAll(filters?: PlatformUserFilters): Promise<{ 
    data: PlatformUser[]; 
    total: number; 
    page: number; 
    limit: number;
    totalPages: number;
  }> {
    return this.get(`${this.basePath}`, { params: filters });
  }

  async getByUuid(uuid: string): Promise<PlatformUser> {
    return this.get(`${this.basePath}/${uuid}`);
  }

  async create(data: CreatePlatformUserRequest): Promise<PlatformUser> {
    return this.post(`${this.basePath}`, data);
  }

  async update(uuid: string, data: UpdatePlatformUserRequest): Promise<PlatformUser> {
    return this.put(`${this.basePath}/${uuid}`, data);
  }

  async toggleStatus(uuid: string, isActive: boolean): Promise<PlatformUser> {
    return this.patch(`${this.basePath}/${uuid}/status`, { isActive });
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    return this.delete(`${this.basePath}/${uuid}`);
  }

  async resetPassword(uuid: string): Promise<{ success: boolean; temporaryPassword: string }> {
    return this.post(`${this.basePath}/${uuid}/reset-password`);
  }
}

export const platformUsersService = new PlatformUsersService();