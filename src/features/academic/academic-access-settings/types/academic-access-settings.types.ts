// src/features/academic/academic-access-settings/types/academic-access-settings.types.ts

export interface AcademicRoleSettings {
  studentRoleId: number | null;
  teacherRoleId: number | null;
}

export interface UpdateAcademicRoleSettingsRequest {
  studentRoleId: number;
  teacherRoleId: number;
}

export interface RoleOption {
  id: number;
  name: string;
}