import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type { 
  AcademicYear, 
  CreateAcademicYearRequest, 
  UpdateAcademicYearRequest,
  AcademicYearFilters,
  RolloverPreview,
  RolloverRequest,
  RolloverResult,
} from '../types/academic-year.types';

class AcademicYearService extends ApiService {
  private basePath = '/academic-years';

  constructor() {
    super('company');
  }

  async getAll(filters?: AcademicYearFilters): Promise<{ 
    data: AcademicYear[]; 
    total: number; 
    page: number; 
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    const extracted = extractApiList<AcademicYear>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByUuid(uuid: string): Promise<AcademicYear> {
    const response = await this.get<any>(`${this.basePath}/${uuid}`);
    return extractApiData<AcademicYear>(response);
  }

  async create(data: CreateAcademicYearRequest): Promise<AcademicYear> {
    const response = await this.post<any>(`${this.basePath}`, data);
    return extractApiData<AcademicYear>(response);
  }

  async update(uuid: string, data: UpdateAcademicYearRequest): Promise<AcademicYear> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
    return extractApiData<AcademicYear>(response);
  }

  async toggleStatus(uuid: string, isActive: boolean): Promise<AcademicYear> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
    return extractApiData<AcademicYear>(response);
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${uuid}`);
    return extractApiData<{ success: boolean }>(response);
  }
}

// Passagem de ano: copiar plano curricular, turmas e atribuições de outro ano
class AcademicYearRolloverService extends ApiService {
  constructor() {
    super('company');
  }

  async preview(targetUuid: string, sourceUuid: string): Promise<RolloverPreview> {
    const response = await this.get<unknown>(`/academic-years/${targetUuid}/rollover-preview`, {
      params: { sourceAcademicYearUuid: sourceUuid },
    });
    return extractApiData<RolloverPreview>(response);
  }

  async execute(targetUuid: string, data: RolloverRequest): Promise<RolloverResult> {
    const response = await this.post<unknown>(`/academic-years/${targetUuid}/rollover`, data);
    return extractApiData<RolloverResult>(response);
  }
}

export const academicYearRolloverService = new AcademicYearRolloverService();

export const academicYearService = new AcademicYearService();