import { ApiService, ApiServiceOptions } from '@/shared/services/api/api.service';

export interface Permission {
  id: string;
  uuid: string;
  name: string;
  code: string;
  module: string;
  description?: string;
  isActive: boolean;
}

export interface Role {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  companyId: string;
  isActive: boolean;
  permissions: Permission[];
  usersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds: string[];
  companyId: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: string[];
  isActive?: boolean;
}

export interface RoleFilters {
  search?: string;
  companyId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

class RoleService extends ApiService {
  private basePath = '/roles';

  async getAll(filters?: RoleFilters): Promise<{ data: Role[]; total: number; page: number; limit: number }> {
    return this.get<{ data: Role[]; total: number; page: number; limit: number }>(`${this.basePath}`, { params: filters });
  }

  async getById(id: string): Promise<Role> {
    return this.get<Role>(`${this.basePath}/${id}`);
  }

  async create(data: CreateRoleRequest): Promise<Role> {
    return this.post<Role>(`${this.basePath}`, data);
  }

  async update(id: string, data: UpdateRoleRequest): Promise<Role> {
    return this.patch<Role>(`${this.basePath}/${id}`, data);
  }

  // CORRIGIDO: Usar método com nome diferente para evitar conflito
  async remove(id: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`${this.basePath}/${id}`);
  }

  async toggleActive(id: string): Promise<Role> {
    return this.patch<Role>(`${this.basePath}/${id}/toggle-active`);
  }

  async getPermissions(): Promise<Permission[]> {
    return this.get<Permission[]>('/permissions');
  }

  async getByCompany(companyId: string): Promise<{ data: Role[] }> {
    return this.get<{ data: Role[] }>(`${this.basePath}/company/${companyId}`);
  }
}

export const roleService = new RoleService();