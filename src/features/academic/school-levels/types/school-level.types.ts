export interface SchoolLevel {
  id: number;
  uuid: string;
  companyId: number;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateSchoolLevelRequest {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSchoolLevelRequest {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface SchoolLevelFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}