export interface PlatformRole {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  companyId: number | null;
  isAdmin: boolean;
  isSystem: boolean;
  isActive: boolean;
  permissions?: {
    id: number;
    code: string;
    name: string;
    module: string;
  }[];
  usersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformRoleRequest {
  name: string;
  description?: string;
  permissionIds: number[];
  companyId?: number | null;
  isAdmin?: boolean;
}

export interface UpdatePlatformRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: number[];
  isActive?: boolean;
}

export interface PlatformRoleFilters {
  search?: string;
  companyId?: number;
  isAdmin?: boolean;
  isSystem?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}