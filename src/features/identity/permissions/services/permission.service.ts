import { ApiService, ApiServiceOptions } from '@/shared/services/api/api.service';

export interface Permission {
  id: string;
  uuid: string;
  name: string;
  code: string;
  module: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionFilters {
  module?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

class PermissionService extends ApiService {
  private basePath = '/permissions';

  async getAll(filters?: PermissionFilters): Promise<{ data: Permission[]; total: number; page: number; limit: number }> {
    return this.get<{ data: Permission[]; total: number; page: number; limit: number }>(`${this.basePath}`, { params: filters });
  }

  async getById(id: string): Promise<Permission> {
    return this.get<Permission>(`${this.basePath}/${id}`);
  }

  async getModules(): Promise<string[]> {
    return this.get<string[]>(`${this.basePath}/modules`);
  }

  async getByModule(module: string): Promise<Permission[]> {
    return this.get<Permission[]>(`${this.basePath}/module/${module}`);
  }

  async create(data: Omit<Permission, 'id' | 'uuid' | 'createdAt' | 'updatedAt'>): Promise<Permission> {
    return this.post<Permission>(`${this.basePath}`, data);
  }

  async update(id: string, data: Partial<Permission>): Promise<Permission> {
    return this.patch<Permission>(`${this.basePath}/${id}`, data);
  }

  // CORRIGIDO: Não sobrescrever, apenas usar o método da classe base
  // ou usar um nome diferente
  async remove(id: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`${this.basePath}/${id}`);
  }

  // Alternativa: usar o método delete da classe base diretamente
  // async deletePermission(id: string): Promise<{ success: boolean }> {
  //   return this.delete<{ success: boolean }>(`${this.basePath}/${id}`);
  // }
}

export const permissionService = new PermissionService();