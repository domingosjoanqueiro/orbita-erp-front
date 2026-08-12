export interface Class {
  id: number;
  uuid: string;
  companyId: number;
  academicYearId: number;
  academicYearUuid: string;
  academicYearName: string;
  gradeId: number;
  gradeUuid: string;
  gradeName: string;
  gradeCode: string;
  name: string;
  shift: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FULL';
  capacity: number;
  room?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateClassRequest {
  academicYearUuid: string;
  gradeUuid: string;
  name: string;
  shift: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FULL';
  capacity: number;
  room?: string;
  isActive?: boolean;
}

export interface UpdateClassRequest {
  academicYearUuid?: string;
  gradeUuid?: string;
  name?: string;
  shift?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FULL';
  capacity?: number;
  room?: string;
  isActive?: boolean;
}

export interface ClassFilters {
  search?: string;
  academicYearUuid?: string;
  gradeUuid?: string;
  shift?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ClassWithDetails extends Class {
  academicYear: {
    id: number;
    uuid: string;
    name: string;
    year: number;
  };
  academicYearName: string;
  grade: {
    id: number;
    uuid: string;
    name: string;
    code: string;
    programName: string;
  };
  studentCount?: number;
}