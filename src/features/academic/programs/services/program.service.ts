import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type { 
  Program, 
  CreateProgramRequest, 
  UpdateProgramRequest,
  ProgramFilters 
} from '../types/program.types';

interface SchoolLevel {
  id: number;
  name: string;
  uuid: string;
  code: string;
}

class ProgramService extends ApiService {
  private basePath = '/programs';

  constructor() {
    super('company');
  }

  async getAll(filters?: ProgramFilters): Promise<{ 
    data: Program[]; 
    total: number; 
    page: number; 
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    const extracted = extractApiList<Program>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByUuid(uuid: string): Promise<Program> {
    const response = await this.get<any>(`${this.basePath}/${uuid}`);
    return extractApiData<Program>(response);
  }

 async create(data: CreateProgramRequest): Promise<Program> {
  console.log('📤 ProgramService.create - Dados recebidos:', JSON.stringify(data, null, 2));
  console.log('📤 ProgramService.create - schoolLevelId:', data.schoolLevelId, 'tipo:', typeof data.schoolLevelId);
  
  const response = await this.post<any>(`${this.basePath}`, data);
  console.log('📥 ProgramService.create - Resposta:', response);
  return extractApiData<Program>(response);
}


  async update(uuid: string, data: UpdateProgramRequest): Promise<Program> {
    console.log('📤 ProgramService.update - Dados recebidos:', data);
    const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
    console.log('📥 ProgramService.update - Resposta:', response);
    return extractApiData<Program>(response);
  }

  async toggleStatus(uuid: string, isActive: boolean): Promise<Program> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
    return extractApiData<Program>(response);
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${uuid}`);
    return extractApiData<{ success: boolean }>(response);
  }

  async getSchoolLevels(): Promise<SchoolLevel[]> {
    const response = await this.get<any>('/school-levels');
    const extracted = extractApiList<SchoolLevel>(response);
    return extracted.data;
  }
}

export const programService = new ProgramService();