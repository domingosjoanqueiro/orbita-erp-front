import { ApiService } from '@/shared/services/api/api.service';
import type { PlatformStats, PlatformActivity } from '../types/dashboard.types';

class PlatformDashboardService extends ApiService {
  private basePath = '/system/dashboard';

  constructor() {
    super('platform');
  }

  async getStats(): Promise<PlatformStats> {
    try {
      const response = await this.get<any>(`${this.basePath}/stats`);
      console.log('📊 Resposta completa da API:', response);
      
      // A resposta está dentro de response.data
      const data = response.data || response;
      
      console.log('📊 Dados extraídos:', data);
      
      // Mapear a resposta para o formato esperado
      const stats: PlatformStats = {
        totalCompanies: data.totalCompanies || 0,
        totalUsers: data.totalUsers || 0,
        totalStudents: data.totalStudents || 0,
        totalTeachers: data.totalTeachers || 0,
        totalSystemUsers: data.totalSystemUsers || 0,
        activeCompanies: data.activeCompanies || 0,
        inactiveCompanies: data.inactiveCompanies || 0,
        recentCompanies: data.recentCompanies?.map((company: any) => ({
          id: company.id || 0,
          name: company.name || '',
          email: company.email || '',
          country: company.country || '',
          isActive: company.isActive || false,
          createdAt: company.createdAt || new Date().toISOString(),
          usersCount: company.usersCount || 0,
        })) || [],
        recentSystemUsers: data.recentSystemUsers?.map((user: any) => ({
          id: user.id || 0,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          isRoot: user.isRoot || false,
          isActive: user.isActive || false,
          createdAt: user.createdAt || new Date().toISOString(),
        })) || [],
      };
      
      console.log('📊 Stats mapeados:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Erro ao buscar stats:', error);
      return {
        totalCompanies: 0,
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalSystemUsers: 0,
        activeCompanies: 0,
        inactiveCompanies: 0,
        recentCompanies: [],
        recentSystemUsers: [],
      };
    }
  }

  async getActivities(): Promise<{ data: PlatformActivity[]; total: number }> {
    try {
      const response = await this.get<{ data: PlatformActivity[]; total: number }>(`${this.basePath}/activities`);
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar atividades:', error);
      return { data: [], total: 0 };
    }
  }
}

export const platformDashboardService = new PlatformDashboardService();