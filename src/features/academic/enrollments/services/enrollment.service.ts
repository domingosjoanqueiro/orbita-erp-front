// src/features/academic/enrollments/services/enrollment.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type {
  Enrollment,
  CreateEnrollmentRequest,
  CreateEnrollmentWithStudentRequest,
  UpdateEnrollmentRequest,
  EnrollmentResponse,
  EnrollmentFilters,
  StudentSearchResult,
} from '../types/enrollment.types';

class EnrollmentService extends ApiService {
  private basePath = '/enrollments';

  constructor() {
    super('company');
  }

  async getAll(filters?: EnrollmentFilters): Promise<{
    data: Enrollment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    
    console.log('📥 EnrollmentService.getAll - Resposta:', response);
    const extracted = extractApiList<Enrollment>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByUuid(uuid: string): Promise<Enrollment> {
    const response = await this.get<any>(`${this.basePath}/${uuid}`);
    return extractApiData<Enrollment>(response);
  }

  // ✅ Criar matrícula para estudante existente
  async create(data: CreateEnrollmentRequest): Promise<EnrollmentResponse> {
    const response = await this.post<any>(`${this.basePath}`, data);
    console.log('📥 EnrollmentService.create - Resposta:', response);
    return extractApiData<EnrollmentResponse>(response);
  }

  // ✅ Criar matrícula com novo estudante
  async createWithStudent(data: CreateEnrollmentWithStudentRequest): Promise<EnrollmentResponse> {
    const response = await this.post<any>(`${this.basePath}/register-student`, data);
    console.log('📥 EnrollmentService.createWithStudent - Resposta:', response);
    return extractApiData<EnrollmentResponse>(response);
  }

  // ✅ Atualizar matrícula
  async update(uuid: string, data: UpdateEnrollmentRequest): Promise<Enrollment> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
    console.log('📥 EnrollmentService.update - Resposta:', response);
    return extractApiData<Enrollment>(response);
  }

  // ✅ Pesquisar estudantes
 async searchStudents(query: string): Promise<StudentSearchResult[]> {
    const response = await this.get<any>(`${this.basePath}/students`, { 
      params: { q: query } 
    });
    console.log('📥 EnrollmentService.searchStudents - Resposta:', response);
    return extractApiList<StudentSearchResult>(response).data;
  }



  async toggleStatus(uuid: string, isActive: boolean): Promise<Enrollment> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
    return extractApiData<Enrollment>(response);
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${uuid}`);
    return extractApiData<{ success: boolean }>(response);
  }
}

export const enrollmentService = new EnrollmentService();