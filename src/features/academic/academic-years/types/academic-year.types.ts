export interface AcademicYear {
  id: number;
  uuid: string;
  companyId: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateAcademicYearRequest {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdateAcademicYearRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface AcademicYearFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}