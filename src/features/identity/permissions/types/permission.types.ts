// src/shared/types/permission.types.ts

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  module: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionFilters {
  search?: string;
  module?: string;
  resource?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}