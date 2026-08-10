export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roleId: string;
  role?: {
    id: string;
    name: string;
    permissions: Permission[];
  };
  companyId: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  roleId: string;
  companyId: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  roleId?: string;
  companyId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}