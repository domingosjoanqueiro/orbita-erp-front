import { apiClient } from '@/shared/services/api/client';
import type { User, CreateUserDTO, UpdateUserDTO, UserFilters } from '../types/user.types';

class UserService {
  private basePath = '/users';

  async getAll(filters?: UserFilters) {
    const { data } = await apiClient.get(this.basePath, { params: filters });
    return data;
  }

  async getById(id: string) {
    const { data } = await apiClient.get(`${this.basePath}/${id}`);
    return data;
  }

  async create(userData: CreateUserDTO) {
    const { data } = await apiClient.post(this.basePath, userData);
    return data;
  }

  async update(id: string, userData: UpdateUserDTO) {
    const { data } = await apiClient.patch(`${this.basePath}/${id}`, userData);
    return data;
  }

  async delete(id: string) {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async toggleActive(id: string) {
    const { data } = await apiClient.patch(`${this.basePath}/${id}/toggle-active`);
    return data;
  }
}

export const userService = new UserService();