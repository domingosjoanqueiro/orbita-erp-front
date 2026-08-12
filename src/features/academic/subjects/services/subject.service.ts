import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type {
  Subject,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  SubjectFilters
} from '../types/subject.types';

class SubjectService extends ApiService {
  private basePath = '/subjects';

  constructor() {
    super('company');
  }

  async getAll(filters?: SubjectFilters): Promise<{
    data: Subject[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    
    console.log('📥 SubjectService.getAll - Resposta:', response);
    const extracted = extractApiList<Subject>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByUuid(uuid: string): Promise<Subject> {
    const response = await this.get<any>(`${this.basePath}/${uuid}`);
    return extractApiData<Subject>(response);
  }

  async create(data: CreateSubjectRequest): Promise<Subject> {
    const response = await this.post<any>(`${this.basePath}`, data);
    return extractApiData<Subject>(response);
  }

  async update(uuid: string, data: UpdateSubjectRequest): Promise<Subject> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
    return extractApiData<Subject>(response);
  }

  async toggleStatus(uuid: string, isActive: boolean): Promise<Subject> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
    return extractApiData<Subject>(response);
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${uuid}`);
    return extractApiData<{ success: boolean }>(response);
  }
}

export const subjectService = new SubjectService();