// src/features/identity/permissions/types/permission.types.ts

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
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