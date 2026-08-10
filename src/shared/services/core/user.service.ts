import { ApiService, ApiServiceOptions } from '../api/api.service';

export interface User {
  id: string;
  uuid: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  roles: {
    id: string;
    name: string;
  }[];
  company: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  roleIds: string[];
  companyId: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roleIds?: string[];
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

class UserService extends ApiService {
  private basePath = '/users';

  async getAll(filters?: UserFilters): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    return this.get<{ data: User[]; total: number; page: number; limit: number }>(`${this.basePath}`, { params: filters });
  }

  async getById(id: string): Promise<User> {
    return this.get<User>(`${this.basePath}/${id}`);
  }

  async create(data: CreateUserRequest): Promise<User> {
    return this.post<User>(`${this.basePath}`, data);
  }

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    return this.patch<User>(`${this.basePath}/${id}`, data);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`${this.basePath}/${id}`);
  }

  async toggleActive(id: string): Promise<User> {
    return this.patch<User>(`${this.basePath}/${id}/toggle-active`);
  }

  async resetPassword(id: string): Promise<{ success: boolean; temporaryPassword: string }> {
    return this.post<{ success: boolean; temporaryPassword: string }>(`${this.basePath}/${id}/reset-password`);
  }
}

export const userService = new UserService();