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
    
    console.log('📥 StudentService.getAll - Resposta:', response);
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
    console.log('📥 StudentService.create - Resposta:', response);
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
    console.log('📥 StudentService.createUser - Resposta:', response);
    return extractApiData<{ username: string; temporaryPassword: string; userId: number }>(response);
  }

  /**
   * ✅ Redefine a senha do usuário de um estudante
   * Gera uma nova senha temporária
   */
  async resetPassword(userUuid: string): Promise<{ 
    temporaryPassword: string;
    username: string;
  }> {
    const response = await this.post<any>(`/system/users/${userUuid}/reset-password`);
    console.log('📥 StudentService.resetPassword - Resposta:', response);
    return extractApiData<{ temporaryPassword: string; username: string }>(response);
  }

  /**
   * ✅ Ativa ou desativa o usuário de um estudante
   */
  async toggleUserStatus(userUuid: string, isActive: boolean): Promise<{ 
    success: boolean;
    isActive: boolean;
  }> {
    const response = await this.patch<any>(`/system/users/${userUuid}/status`, { isActive });
    console.log('📥 StudentService.toggleUserStatus - Resposta:', response);
    return extractApiData<{ success: boolean; isActive: boolean }>(response);
  }

  /**
   * ✅ Verifica se o estudante já possui usuário
   */
  async checkUserExists(studentUuid: string): Promise<{ 
    hasUser: boolean;
    userId?: number;
    username?: string;
  }> {
    const response = await this.get<any>(`${this.basePath}/${studentUuid}/user-status`);
    console.log('📥 StudentService.checkUserExists - Resposta:', response);
    return extractApiData<{ hasUser: boolean; userId?: number; username?: string }>(response);
  }
}

export const studentService = new StudentService();