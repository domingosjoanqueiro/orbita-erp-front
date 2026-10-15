// src/features/identity/roles/types/role.types.ts

import type { Permission } from '../../permissions/types/permission.types';

export interface Role {

  id: number;

  uuid: string;

  name: string;

  description?: string;

  permissions: Permission[];

  isAdmin: boolean;

  isSystem: boolean;

  isActive: boolean;

  usersCount?: number;

  createdAt: string;

  updatedAt: string;

  deletedAt?: string | null;

}


export interface CreateRoleRequest {

  name: string;

  description?: string;

  isAdmin?: boolean;

  permissionIds: string[];

}


export interface UpdateRoleRequest {

  name?: string;

  description?: string;

  isAdmin?: boolean;

  permissionIds?: string[];

}


export interface RoleFilters {

  search?: string;

  isAdmin?: boolean;

  isSystem?: boolean;

  isActive?: boolean;

  page?: number;

  limit?: number;

}