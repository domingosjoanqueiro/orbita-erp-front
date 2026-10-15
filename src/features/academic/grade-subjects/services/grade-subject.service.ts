// src/features/academic/grade-subjects/services/grade-subject.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type {
  GradeSubject,
  GradeSubjectWithDetails,
  CreateGradeSubjectRequest,
  UpdateGradeSubjectRequest,
  GradeSubjectFilters,
  BulkCreateGradeSubjectRequest,
  BulkRemoveGradeSubjectRequest,
  BulkCreateWithWorkloadRequest,
} from '../types/grade-subject.types';

class GradeSubjectService extends ApiService {
  private basePath = '/grade-subjects';

  constructor() {
    super('company');
  }

  async getAll(filters?: GradeSubjectFilters): Promise<{
    data: GradeSubjectWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    
    console.log('📥 GradeSubjectService.getAll - Resposta:', response);
    const extracted = extractApiList<GradeSubjectWithDetails>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByUuid(uuid: string): Promise<GradeSubjectWithDetails> {
    const response = await this.get<any>(`${this.basePath}/${uuid}`);
    return extractApiData<GradeSubjectWithDetails>(response);
  }

  async create(data: CreateGradeSubjectRequest): Promise<GradeSubject> {
    const response = await this.post<any>(`${this.basePath}`, data);
    return extractApiData<GradeSubject>(response);
  }

  async update(uuid: string, data: UpdateGradeSubjectRequest): Promise<GradeSubject> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
    return extractApiData<GradeSubject>(response);
  }

  async toggleStatus(uuid: string, isActive: boolean): Promise<GradeSubject> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
    return extractApiData<GradeSubject>(response);
  }

  async toggleMandatory(uuid: string, isMandatory: boolean): Promise<GradeSubject> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/mandatory`, { isMandatory });
    return extractApiData<GradeSubject>(response);
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${uuid}`);
    return extractApiData<{ success: boolean }>(response);
  }

  // ✅ Bulk Create com carga horária individual
  async bulkCreateWithWorkload(data: BulkCreateWithWorkloadRequest): Promise<any> {
    console.log("📤 BULK CREATE WITH WORKLOAD:", data);
    const response = await this.post<any>(`${this.basePath}/bulk-with-workload`, data);
    console.log("📥 BULK CREATE WITH WORKLOAD RESPONSE:", response);
    return extractApiData<any>(response);
  }

  // ✅ Bulk Create simples
  async bulkCreate(data: BulkCreateGradeSubjectRequest): Promise<any> {
    console.log("📤 BULK CREATE:", data);
    const response = await this.post<any>(`${this.basePath}/bulk`, data);
    console.log("📥 BULK CREATE RESPONSE:", response);
    return extractApiData<any>(response);
  }

  // ✅ Bulk Remove
  async bulkRemove(data: BulkRemoveGradeSubjectRequest): Promise<any> {
    console.log("📤 BULK REMOVE:", data);
    const response = await this.post<any>(`${this.basePath}/bulk-remove`, data);
    console.log("📥 BULK REMOVE RESPONSE:", response);
    return extractApiData<any>(response);
  }

  // Métodos auxiliares
  async getByGrade(gradeUuid: string): Promise<GradeSubjectWithDetails[]> {
    const response = await this.get<any>(`${this.basePath}/grade/${gradeUuid}`);
    return extractApiList<GradeSubjectWithDetails>(response).data;
  }

  async getBySubject(subjectUuid: string): Promise<GradeSubjectWithDetails[]> {
    const response = await this.get<any>(`${this.basePath}/subject/${subjectUuid}`);
    return extractApiList<GradeSubjectWithDetails>(response).data;
  }

  async getAvailableSubjects(
    gradeUuid: string,
    academicYearUuid?: string
  ): Promise<{ id: number; uuid: string; name: string; code: string; is_active: boolean }[]> {
    const response = await this.get<any>(
      `${this.basePath}/grade/${gradeUuid}/available-subjects`,
      { params: { academicYearUuid } }
    );

    const extracted = extractApiData<{
      grade: { id: number; uuid: string; name: string };
      subjects: { id: number; uuid: string; name: string; code: string; is_active: boolean }[];
    }>(response);

    return extracted?.subjects || [];
  }

  async getAssignedSubjects(
    gradeUuid: string,
    academicYearUuid?: string
  ): Promise<{ id: number; uuid: string; name: string; code: string; is_active: boolean; weeklyWorkload?: number }[]> {
    const response = await this.get<any>(
      `${this.basePath}/grade/${gradeUuid}/assigned-subjects`,
      { params: { academicYearUuid } }
    );

    const extracted = extractApiData<{
      grade: { id: number; uuid: string; name: string };
      subjects: { id: number; uuid: string; name: string; code: string; is_active: boolean; weeklyWorkload?: number }[];
    }>(response);

    return extracted?.subjects || [];
  }

  async getAllGrades(): Promise<{ id: number; uuid: string; name: string; code: string; order: number }[]> {
    const response = await this.get<any>('/grades', { params: { limit: 100 } });
    return extractApiList<{ id: number; uuid: string; name: string; code: string; order: number }>(response).data;
  }

  async getAllSubjects(): Promise<{ id: number; uuid: string; name: string; code: string }[]> {
    const response = await this.get<any>('/subjects', { params: { limit: 100 } });
    return extractApiList<{ id: number; uuid: string; name: string; code: string }>(response).data;
  }
}

export const gradeSubjectService = new GradeSubjectService();