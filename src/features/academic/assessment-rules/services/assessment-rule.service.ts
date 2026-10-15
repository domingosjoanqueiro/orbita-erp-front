// src/features/academic/assessment-rules/services/assessment-rule.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type {
    AssessmentRule,
    CreateAssessmentRuleRequest,
    UpdateAssessmentRuleRequest,
    AssessmentRuleFilters,
    ProgramOption,
    WeightSummary,
} from '../types/assessment-rule.types';

class AssessmentRuleService extends ApiService {
    private basePath = '/assessment-rules';

    constructor() {
        super('company');
    }

    // ✅ Listar regras
    async getAll(filters?: AssessmentRuleFilters): Promise<{
        data: AssessmentRule[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        // O ApiService envia "isActive" também como "status" (parâmetro lido pela API)
        const response = await this.get<any>(`${this.basePath}`, { params: filters });
        const extracted = extractApiList<AssessmentRule>(response);
        return {
            data: extracted.data,
            total: extracted.total,
            page: extracted.page || filters?.page || 1,
            limit: extracted.limit || filters?.limit || 10,
            totalPages: extracted.totalPages || 1,
        };
    }

    // ✅ Buscar regra por UUID
    async getByUuid(uuid: string): Promise<AssessmentRule> {
        const response = await this.get<any>(`${this.basePath}/${uuid}`);
        return extractApiData<AssessmentRule>(response);
    }

    // ✅ Criar regra
    async create(data: CreateAssessmentRuleRequest): Promise<AssessmentRule> {
        const response = await this.post<any>(`${this.basePath}`, data);
        return extractApiData<AssessmentRule>(response);
    }

    // ✅ Atualizar regra
    async update(uuid: string, data: UpdateAssessmentRuleRequest): Promise<AssessmentRule> {
        const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
        return extractApiData<AssessmentRule>(response);
    }

    // ✅ Ativar/Desativar regra
    async toggleStatus(uuid: string, isActive: boolean): Promise<AssessmentRule> {
        const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
        return extractApiData<AssessmentRule>(response);
    }

    // ✅ Remover regra
    async remove(uuid: string): Promise<void> {
        await this.delete<void>(`${this.basePath}/${uuid}`);
    }

    // ✅ Buscar programas para o filtro
    async getPrograms(): Promise<ProgramOption[]> {
        // Só programas ativos: o backend rejeita regras em programas inativos
        const response = await this.get<any>('/programs', { params: { limit: 100, status: true } });
        return extractApiList<ProgramOption>(response).data;
    }

    // ✅ Calcular peso total por programa
    async getWeightSummary(programUuid: string): Promise<WeightSummary> {
        const response = await this.get<any>(`${this.basePath}/weight-summary/${programUuid}`);
        return extractApiData<WeightSummary>(response);
    }
}

export const assessmentRuleService = new AssessmentRuleService();