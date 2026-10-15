// src/features/identity/roles/services/role.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type { Role, CreateRoleRequest, UpdateRoleRequest, RoleFilters } from '../types/role.types';

class RoleService extends ApiService {
  private basePath = '/roles';

  constructor() {
    super('company');
  }

  async getAll(filters?: RoleFilters): Promise<{
    data: Role[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    
    console.log('📥 RoleService.getAll - Resposta:', response);
    const extracted = extractApiList<Role>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getById(id: string): Promise<Role> {
    const response = await this.get<any>(`${this.basePath}/${id}`);
    return extractApiData<Role>(response);
  }

  async create(data: CreateRoleRequest): Promise<Role> {
    const response = await this.post<any>(`${this.basePath}`, data);
    return extractApiData<Role>(response);
  }

  async update(id: string, data: UpdateRoleRequest): Promise<Role> {
    const response = await this.patch<any>(`${this.basePath}/${id}`, data);
    return extractApiData<Role>(response);
  }

  async toggleStatus(id: string, isActive: boolean): Promise<Role> {
    const response = await this.patch<any>(`${this.basePath}/${id}/status`, { isActive });
    return extractApiData<Role>(response);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${id}`);
    return extractApiData<{ success: boolean }>(response);
  }
}

export const roleService = new RoleService();