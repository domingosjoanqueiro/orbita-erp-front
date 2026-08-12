export interface Program {
    id: number;
    uuid: string;
    companyId: number;

    schoolLevelId: number;

    schoolLevelUuid: string;

    schoolLevel?: {
        id: number;
        uuid: string;
        name: string;
        code: string;
    };

    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}

export interface CreateProgramRequest {
  name: string;
  code: string;
  schoolLevelId: number;  // Obrigatório na criação
  description?: string;
  isActive?: boolean;
}

export interface UpdateProgramRequest {
  name?: string;
  code?: string;
  schoolLevelId?: number;
  description?: string;
  isActive?: boolean;
}

export interface ProgramFilters {
  search?: string;
  schoolLevelId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}