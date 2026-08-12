import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type {
  ProgramAcademicSetting,
  CreateProgramSettingRequest,
  UpdateProgramSettingRequest,
  ProgramSettingFilters
} from '../types/program-setting.types';

class ProgramSettingService extends ApiService {
  private basePath = '/program-academic-settings';

  constructor() {
    super('company');
  }

  async getAll(filters?: ProgramSettingFilters): Promise<{
    data: ProgramAcademicSetting[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    const extracted = extractApiList<ProgramAcademicSetting>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByUuid(uuid: string): Promise<ProgramAcademicSetting> {
    const response = await this.get<any>(`${this.basePath}/${uuid}`);
    return extractApiData<ProgramAcademicSetting>(response);
  }

  async getByProgram(programId: number): Promise<ProgramAcademicSetting> {
    const response = await this.get<any>(`${this.basePath}/program/${programId}`);
    return extractApiData<ProgramAcademicSetting>(response);
  }

  async create(data: CreateProgramSettingRequest): Promise<ProgramAcademicSetting> {
    const response = await this.post<any>(`${this.basePath}`, data);
    return extractApiData<ProgramAcademicSetting>(response);
  }

  async update(uuid: string, data: UpdateProgramSettingRequest): Promise<ProgramAcademicSetting> {
        console.log("📥 ProgramService.update - Resposta:00000");

    const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
    console.log("📥 ProgramService.update - Resposta:", response);
    return extractApiData<ProgramAcademicSetting>(response);
  }

  async toggleStatus(uuid: string, isActive: boolean): Promise<ProgramAcademicSetting> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
    return extractApiData<ProgramAcademicSetting>(response);
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${uuid}`);
    return extractApiData<{ success: boolean }>(response);
  }
}

export const programSettingService = new ProgramSettingService();