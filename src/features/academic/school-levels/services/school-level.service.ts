import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type { 
  SchoolLevel, 
  CreateSchoolLevelRequest, 
  UpdateSchoolLevelRequest,
  SchoolLevelFilters 
} from '../types/school-level.types';

class SchoolLevelService extends ApiService {
  private basePath = '/school-levels';

  constructor() {
    super('company');
  }

  async getAll(filters?: SchoolLevelFilters): Promise<{ 
    data: SchoolLevel[]; 
    total: number; 
    page: number; 
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    const extracted = extractApiList<SchoolLevel>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByUuid(uuid: string): Promise<SchoolLevel> {
    const response = await this.get<any>(`${this.basePath}/${uuid}`);
    return extractApiData<SchoolLevel>(response);
  }

  async create(data: CreateSchoolLevelRequest): Promise<SchoolLevel> {
    const response = await this.post<any>(`${this.basePath}`, data);
    return extractApiData<SchoolLevel>(response);
  }

  async update(uuid: string, data: UpdateSchoolLevelRequest): Promise<SchoolLevel> {
    const response = await this.put<any>(`${this.basePath}/${uuid}`, data);
    return extractApiData<SchoolLevel>(response);
  }

  async toggleStatus(uuid: string, isActive: boolean): Promise<SchoolLevel> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
    return extractApiData<SchoolLevel>(response);
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${uuid}`);
    return extractApiData<{ success: boolean }>(response);
  }
}

export const schoolLevelService = new SchoolLevelService();