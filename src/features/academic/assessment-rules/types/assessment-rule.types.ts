// src/features/academic/assessment-rules/types/assessment-rule.types.ts

// Espelha AssessmentRuleResponseDTO do backend
export interface AssessmentRule {
    uuid: string;
    programUuid: string;
    programName: string;
    code: string;
    name: string;
    sequence: number;
    weight: number;
    maximumScore: number;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAssessmentRuleRequest {
    programUuid: string;
    code: string;
    name: string;
    sequence: number;
    weight: number;
    maximumScore: number;
    description?: string | null;
    isActive?: boolean;
}

export interface UpdateAssessmentRuleRequest {
    programUuid?: string;
    code?: string;
    name?: string;
    sequence?: number;
    weight?: number;
    maximumScore?: number;
    description?: string | null;
    isActive?: boolean;
}

export interface AssessmentRuleFilters {
    search?: string;
    programUuid?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

export interface ProgramOption {
    uuid: string;
    name: string;
    code: string;
    label: string;
}

// Soma dos pesos das regras ATIVAS do programa
export interface WeightSummary {
    totalWeight: number;
    rulesCount: number;
    isComplete: boolean;
    remainingWeight: number;
    exceedsLimit: boolean;
}