import { ApiService } from '@/shared/services/api/api.service';
import type { 
  CompanyDashboardData, 
  CompanyDashboardStats,
  DashboardActivity,
  DashboardEvent 
} from '../types/dashboard.types';

class CompanyDashboardService extends ApiService {
  private basePath = '/dashboard';

  constructor() {
    super('company');
  }

  async getDashboardData(): Promise<CompanyDashboardData> {
    const response = await this.get<any>(`${this.basePath}/company`);
    return response?.data || response;
  }

  async getStats(): Promise<CompanyDashboardStats> {
    const response = await this.get<any>(`${this.basePath}/company/stats`);
    // A resposta tem a estrutura: { success, message, data }
    // Retornamos apenas o data
    return response?.data || response;
  }

  async getActivities(): Promise<{ data: DashboardActivity[]; total: number }> {
    const response = await this.get<any>(`${this.basePath}/company/activities`);
    // Se a resposta tiver data, retorna ela, senão retorna a resposta completa
    if (response?.data) {
      return response.data;
    }
    // Se a resposta já for o array diretamente
    if (Array.isArray(response)) {
      return { data: response, total: response.length };
    }
    // Fallback
    return { data: [], total: 0 };
  }

  async getEvents(): Promise<{ data: DashboardEvent[]; total: number }> {
    const response = await this.get<any>(`${this.basePath}/company/events`);
    if (response?.data) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return { data: response, total: response.length };
    }
    return { data: [], total: 0 };
  }

  async refresh(): Promise<CompanyDashboardData> {
    const response = await this.post<any>(`${this.basePath}/company/refresh`);
    return response?.data || response;
  }
}

export const companyDashboardService = new CompanyDashboardService();