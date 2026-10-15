// src/features/academic/teachers/services/teacher.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type {
  Teacher,
  TeacherWithUser,
  CreateTeacherRequest,
  UpdateTeacherRequest,
  TeacherFilters,
  TeacherResponseWithCredentials,
} from '../types/teacher.types';

class TeacherService extends ApiService {
  private basePath = '/teachers';

  constructor() {
    super('company');
  }

  async getAll(filters?: TeacherFilters): Promise<{
    data: TeacherWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    
    console.log('📥 TeacherService.getAll - Resposta:', response);
    const extracted = extractApiList<TeacherWithUser>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByUuid(uuid: string): Promise<TeacherWithUser> {
    const response = await this.get<any>(`${this.basePath}/${uuid}`);
    return extractApiData<TeacherWithUser>(response);
  }

  async create(data: CreateTeacherRequest): Promise<TeacherResponseWithCredentials> {
    const response = await this.post<any>(`${this.basePath}`, data);
    console.log('📥 TeacherService.create - Resposta:', response);
    return extractApiData<TeacherResponseWithCredentials>(response);
  }

  async update(uuid: string, data: UpdateTeacherRequest): Promise<Teacher> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
    return extractApiData<Teacher>(response);
  }

  async toggleStatus(uuid: string, isActive: boolean): Promise<Teacher> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
    return extractApiData<Teacher>(response);
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${uuid}`);
    return extractApiData<{ success: boolean }>(response);
  }

  // ✅ Método para obter o próximo número de professor (se existir)
  async getNextNumber(): Promise<string> {
    try {
      const response = await this.get<any>(`${this.basePath}/next-number`);
      return extractApiData<{ number: string }>(response).number;
    } catch {
      // Fallback: gerar número localmente se o endpoint não existir
      return `PROF-${String(Date.now()).slice(-6)}`;
    }
  }
}

export const teacherService = new TeacherService();