// src/features/academic/academic-access-settings/services/academic-access-settings.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData } from '@/shared/utils/api.utils';
import type { 
  AcademicRoleSettings, 
  UpdateAcademicRoleSettingsRequest 
} from '../types/academic-access-settings.types';

// ✅ Interface para a resposta da API
interface AcademicSettingsResponse {
  module: string;
  student: {
    roleId: number;
    roleName: string;
  };
  teacher: {
    roleId: number;
    roleName: string;
  };
}

class AcademicAccessSettingsService extends ApiService {
  private basePath = '/module-role-settings';

  constructor() {
    super('company');
  }

  async getAcademicSettings(): Promise<AcademicRoleSettings> {
    const response = await this.get<any>(`${this.basePath}/academic`);
    
    // ✅ Extrair os dados com a estrutura correta
    const data = extractApiData<AcademicSettingsResponse>(response);
    
    // ✅ Mapear para o formato esperado pelo componente
    return {
      studentRoleId: data.student?.roleId || null,
      teacherRoleId: data.teacher?.roleId || null,
    };
  }

  async updateAcademicSettings(data: UpdateAcademicRoleSettingsRequest): Promise<AcademicRoleSettings> {
    const payload = {
      module: 'academic',
      student: {
        roleId: data.studentRoleId,
      },
      teacher: {
        roleId: data.teacherRoleId,
      },
    };
    
    
    const response = await this.put<any>(`${this.basePath}/academic`, payload);
    
    const result = extractApiData<AcademicSettingsResponse>(response);
    
    // ✅ Mapear a resposta para o formato esperado
    return {
      studentRoleId: result.student?.roleId || null,
      teacherRoleId: result.teacher?.roleId || null,
    };
  }
}

export const academicAccessSettingsService = new AcademicAccessSettingsService();