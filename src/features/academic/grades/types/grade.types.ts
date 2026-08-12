export interface Grade {
  id: number;
  uuid: string;
  companyId: number;
  programUuid: string;
  programName: string;
  program?: {
    id: number;
    uuid: string;
    name: string;
    code: string;
  };
  name: string;
  code: string;
  order: number;
  isTerminal: boolean;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateGradeRequest {
  name: string;
  code: string;
  programUuid: string;
  order: number;
  isTerminal?: boolean;
  description?: string;
  isActive?: boolean;
}

export interface UpdateGradeRequest {
  name?: string;
  code?: string;
  programuId?:string;
  order?: number;
  isTerminal?: boolean;
  description?: string;
  isActive?: boolean;
}

export interface GradeFilters {
  search?: string;
  programId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}