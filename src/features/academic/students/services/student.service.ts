// src/features/academic/students/services/student.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type {
  Student,
  StudentWithUser,
  CreateStudentRequest,
  UpdateStudentRequest,
  StudentFilters,
  StudentResponseWithCredentials,
  Grade,
  Class,
} from '../types/student.types';

class StudentService extends ApiService {
  private basePath = '/students';

  constructor() {
    super('company');
  }

  async getAll(filters?: StudentFilters): Promise<{
    data: StudentWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    
    const extracted = extractApiList<StudentWithUser>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByUuid(uuid: string): Promise<StudentWithUser> {
    const response = await this.get<any>(`${this.basePath}/${uuid}`);
    return extractApiData<StudentWithUser>(response);
  }

  // ✅ CREATE - JÁ CRIA O USUÁRIO AUTOMATICAMENTE
  async create(data: CreateStudentRequest): Promise<StudentResponseWithCredentials> {
    const response = await this.post<any>(`${this.basePath}`, data);
    return extractApiData<StudentResponseWithCredentials>(response);
  }

  async update(uuid: string, data: UpdateStudentRequest): Promise<Student> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
    return extractApiData<Student>(response);
  }

  async toggleStatus(uuid: string, isActive: boolean): Promise<Student> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
    return extractApiData<Student>(response);
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${uuid}`);
    return extractApiData<{ success: boolean }>(response);
  }

  // ✅ Método para obter o próximo número de estudante
  async getNextNumber(): Promise<string> {
    try {
      const response = await this.get<any>(`${this.basePath}/next-number`);
      return extractApiData<{ number: string }>(response).number;
    } catch {
      return `EST-${String(Date.now()).slice(-6)}`;
    }
  }

  // ✅ Buscar classes (turmas) com filtro por classe (grade)
  async getClasses(gradeUuid?: string): Promise<Class[]> {
    const params = gradeUuid ? { gradeUuid } : {};
    const response = await this.get<any>('/classes', { params });
    return extractApiList<Class>(response).data;
  }

  // ✅ Buscar classes (grades) para o primeiro select
  async getGrades(): Promise<Grade[]> {
    const response = await this.get<any>('/grades', { params: { limit: 100 } });
    return extractApiList<Grade>(response).data;
  }

  // ================================================================
  // ✅ MÉTODOS PARA GERENCIAR USUÁRIO DO ESTUDANTE
  // ================================================================

  /**
   * ✅ Cria um usuário para um estudante existente
   * Usado quando o estudante foi criado sem usuário
   */
  async createUser(studentUuid: string): Promise<{ 
    username: string; 
    temporaryPassword: string;
    userId: number;
  }> {
    const response = await this.post<any>(`${this.basePath}/${studentUuid}/create-user`);
    return extractApiData<{ username: string; temporaryPassword: string; userId: number }>(response);
  }

  /**
   * Gera uma nova senha temporária para o acesso do estudante
   */
  async resetPassword(studentUuid: string): Promise<{ userId: number; username: string; temporaryPassword: string }> {
    const response = await this.post<any>(`${this.basePath}/${studentUuid}/reset-password`);
    return extractApiData(response);
  }

  /**
   * Ativa ou desativa só o acesso (a ficha do estudante não muda)
   */
  async setAccessStatus(studentUuid: string, isActive: boolean): Promise<StudentWithUser> {
    const response = await this.patch<any>(`${this.basePath}/${studentUuid}/access`, { isActive });
    return extractApiData<StudentWithUser>(response);
  }
}

export const studentService = new StudentService();