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
// ---------------- Passagem de ano (copiar do ano anterior) ----------------

export interface RolloverPreviewClass {
  uuid: string;
  gradeName: string;
  name: string;
  shift: string;
  capacity: number;
  room: string | null;
  assignmentsCount: number;
  directorName: string | null;
  existsInTarget: boolean;
}

export interface RolloverPreview {
  source: { uuid: string; name: string };
  target: { uuid: string; name: string; startDate: string; endDate: string };
  curriculum: {
    source: { subjects: number; grades: number };
    target: { subjects: number; grades: number };
  };
  targetClassesCount: number;
  classes: RolloverPreviewClass[];
}

export interface RolloverRequest {
  sourceAcademicYearUuid: string;
  copyCurriculum: boolean;
  classUuids: string[];
  copyTeacherAssignments: boolean;
}

export interface RolloverResult {
  curriculumCopied: number;
  classesCreated: number;
  classesReused: string[];
  assignmentsCreated: number;
  skipped: string[];
  message: string;
}
