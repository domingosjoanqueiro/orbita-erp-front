import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type {
  Grade,
  CreateGradeRequest,
  UpdateGradeRequest,
  GradeFilters
} from '../types/grade.types';

class GradeService extends ApiService {
  private basePath = '/grades';

  constructor() {
    super('company');
  }

  async getAll(filters?: GradeFilters): Promise<{
    data: Grade[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });

    console.log('📥 GradeService.getAll - Resposta:', response);
    const extracted = extractApiList<Grade>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByUuid(uuid: string): Promise<Grade> {
    const response = await this.get<any>(`${this.basePath}/${uuid}`);
    return extractApiData<Grade>(response);
  }

  async create(data: CreateGradeRequest): Promise<Grade> {
    const response = await this.post<any>(`${this.basePath}`, data);
    return extractApiData<Grade>(response);
  }

  async update(uuid: string, data: UpdateGradeRequest): Promise<Grade> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
    console.log("a resposta",response)
    return extractApiData<Grade>(response);
  }

  async toggleStatus(uuid: string, isActive: boolean): Promise<Grade> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
    return extractApiData<Grade>(response);
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${uuid}`);
    return extractApiData<{ success: boolean }>(response);
  }

  async getPrograms(): Promise<{ id: number; uuid: string; name: string; code: string }[]> {
    const response = await this.get<any>('/programs');
    return extractApiList<{ id: number; uuid: string; name: string; code: string }>(response).data;
  }
}

export const gradeService = new GradeService();