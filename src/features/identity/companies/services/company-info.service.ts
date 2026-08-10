import { ApiService } from '@/shared/services/api/api.service';
import type { CompanyInfo, UpdateCompanyInfoRequest } from '../types/company-info.types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class CompanyInfoService extends ApiService {
  private basePath = '/company';

  constructor() {
    super('company');
  }

  async getInfo(): Promise<CompanyInfo> {
    const response = await this.get<ApiResponse<CompanyInfo>>(`${this.basePath}/settings`);
    // A resposta pode ser { success, message, data } ou diretamente o objeto
    console.log('📥 companyInfoService.getInfo response:', response);
    return (response as any)?.data || response;
  }

  async updateInfo(data: UpdateCompanyInfoRequest): Promise<CompanyInfo> {
    const response = await this.put<ApiResponse<CompanyInfo>>(`${this.basePath}/settings`, data);
    return (response as any)?.data || response;
  }

  async uploadLogo(file: File): Promise<{ logo: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await this.post<ApiResponse<{ logo: string }>>(`${this.basePath}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return (response as any)?.data || response;
  }

  async removeLogo(): Promise<{ success: boolean }> {
    const response = await this.delete<ApiResponse<{ success: boolean }>>(`${this.basePath}/logo`);
    return (response as any)?.data || response;
  }
}

export const companyInfoService = new CompanyInfoService();