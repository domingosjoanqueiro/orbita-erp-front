import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type {
  Class,
  ClassWithDetails,
  CreateClassRequest,
  UpdateClassRequest,
  ClassFilters
} from '../types/class.types';

class ClassService extends ApiService {
  private basePath = '/classes';

  constructor() {
    super('company');
  }

  async getAll(filters?: ClassFilters): Promise<{
    data: ClassWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    
    console.log('📥 ClassService.getAll - Resposta:', response);
    const extracted = extractApiList<ClassWithDetails>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByUuid(uuid: string): Promise<ClassWithDetails> {
    const response = await this.get<any>(`${this.basePath}/${uuid}`);
    return extractApiData<ClassWithDetails>(response);
  }

  async create(data: CreateClassRequest): Promise<Class> {
    const response = await this.post<any>(`${this.basePath}`, data);
    return extractApiData<Class>(response);
  }

  async update(uuid: string, data: UpdateClassRequest): Promise<Class> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
    return extractApiData<Class>(response);
  }

  async toggleStatus(uuid: string, isActive: boolean): Promise<Class> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
    return extractApiData<Class>(response);
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${uuid}`);
    return extractApiData<{ success: boolean }>(response);
  }

  // Métodos auxiliares para carregar dados relacionados
  async getAcademicYears(): Promise<{ id: number; uuid: string; name: string; year: number }[]> {
    const response = await this.get<any>('/academic-years');
    return extractApiList<{ id: number; uuid: string; name: string; year: number }>(response).data;
  }

  async getGrades(): Promise<{ id: number; uuid: string; name: string; code: string; programName: string }[]> {
    const response = await this.get<any>('/grades');
    return extractApiList<{ id: number; uuid: string; name: string; code: string; programName: string }>(response).data;
  }
}

export const classService = new ClassService();