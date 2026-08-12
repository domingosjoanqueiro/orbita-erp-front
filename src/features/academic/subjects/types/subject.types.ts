export interface Subject {
  id: number;
  uuid: string;
  companyId: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateSubjectRequest {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSubjectRequest {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface SubjectFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}