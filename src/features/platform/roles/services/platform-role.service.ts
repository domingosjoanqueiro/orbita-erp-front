import { ApiService } from '@/shared/services/api/api.service';
import type {
    PlatformRole,
    CreatePlatformRoleRequest,
    UpdatePlatformRoleRequest,
    PlatformRoleFilters
} from '../types/platform-role.types';

class PlatformRoleService extends ApiService {
    private basePath = '/roles';

    constructor() {
        super('platform');
    }

    async getAll(filters?: PlatformRoleFilters): Promise<{
        data: PlatformRole[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        return this.get(`${this.basePath}`, { params: filters });
    }

    async getByUuid(uuid: string): Promise<PlatformRole> {
        return this.get(`${this.basePath}/${uuid}`);
    }

    async create(data: CreatePlatformRoleRequest): Promise<PlatformRole> {
        return this.post(`${this.basePath}`, data);
    }

    async update(uuid: string, data: UpdatePlatformRoleRequest): Promise<PlatformRole> {
        return this.put(`${this.basePath}/${uuid}`, data);
    }

    async toggleStatus(uuid: string, isActive: boolean): Promise<PlatformRole> {
        return this.patch(`${this.basePath}/${uuid}/status`, { isActive });
    }

    async remove(uuid: string): Promise<{ success: boolean }> {
        return this.delete(`${this.basePath}/${uuid}`);
    }

    async getPermissions(): Promise<{ id: number; code: string; name: string; module: string }[]> {
        return this.get('/permissions');
    }
}

export const platformRoleService = new PlatformRoleService();