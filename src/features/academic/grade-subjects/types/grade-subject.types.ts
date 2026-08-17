// src/features/academic/grade-subjects/types/grade-subject.types.ts

export interface GradeSubject {
  id: number;
  uuid: string;
  companyId: number;
  gradeId: number;
  subjectId: number;
  gradeUuid?: string;
  subjectUuid?: string;
  weeklyWorkload?: number;
  isMandatory: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateGradeSubjectRequest {
  gradeId: number;
  subjectId: number;
  weeklyWorkload?: number;
  isMandatory?: boolean;
  isActive?: boolean;
}

export interface UpdateGradeSubjectRequest {
  weeklyWorkload?: number;
  isMandatory?: boolean;
  isActive?: boolean;
}

export interface GradeSubjectFilters {
  search?: string;
  gradeUuid?: string;
  subjectUuid?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface GradeSubjectWithDetails extends GradeSubject {
  gradeName: string;
  gradeCode: string;
  subjectName: string;
  subjectCode: string;
}

// ✅ Bulk Create com carga horária individual
export interface BulkCreateWithWorkloadRequest {
  gradeUuid: string;
  subjects: {
    subjectUuid: string;
    weeklyWorkload: number;
  }[];
}

// ✅ Bulk Remove
export interface BulkRemoveGradeSubjectRequest {
  gradeUuid: string;
  subjectUuids: string[];
}

// ✅ Bulk Create simples (carga horária padrão)
export interface BulkCreateGradeSubjectRequest {
  gradeUuid: string;
  subjectUuids: string[];
  weeklyWorkload?: number;
}