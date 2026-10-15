// src/features/identity/permissions/services/permission.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type { Permission, PermissionFilters } from '../types/permission.types';

class PermissionService extends ApiService {
  private basePath = '/permissions';

  constructor(authType: 'platform' | 'company' = 'platform') {
    super(authType);
  }

  async getAll(filters?: PermissionFilters): Promise<{
    data: Permission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    const extracted = extractApiList<Permission>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByModule(module: string): Promise<Permission[]> {
    const response = await this.get<any>(`${this.basePath}/module/${module}`);
    return extractApiList<Permission>(response).data;
  }

  async getGroupedByModule(): Promise<Record<string, Permission[]>> {
    const response = await this.get<any>(`${this.basePath}/grouped`);
    return extractApiData<Record<string, Permission[]>>(response);
  }
}

// Painel da plataforma (super admin)
export const permissionService = new PermissionService('platform');

// Painel da empresa: leitura do catálogo para montar as roles
export const companyPermissionService = new PermissionService('company');