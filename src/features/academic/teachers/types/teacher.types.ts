// src/features/academic/teachers/types/teacher.types.ts

export type Gender = 'MALE' | 'FEMALE';
export type DocumentType = 'BI' | 'PASSPORT' | 'DIRE' | 'NUIT';

export interface Teacher {
  id: number;
  uuid: string;
  companyId: number;
  userId?: number;
  teacherNumber: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  gender: Gender;
  birthDate: string;
  phone?: string | null;
  email?: string | null;
  documentType?: DocumentType | null;
  documentNumber?: string | null;
  hireDate: string;
  specialization: string;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateTeacherRequest {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gender: Gender;
  birthDate: string;
  phone?: string | null;
  email?: string | null;
  documentType?: DocumentType | null;
  documentNumber?: string | null;
  hireDate: string;
  specialization?: string | null;
  address?: string | null;
  isActive?: boolean;
}

export interface UpdateTeacherRequest {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  gender?: Gender;
  birthDate?: string;
  phone?: string | null;
  email?: string | null;
  documentType?: DocumentType | null;
  documentNumber?: string | null;
  hireDate?: string;
  specialization?: string | null;
  address?: string | null;
  isActive?: boolean;
}

export interface TeacherFilters {
  search?: string;
  gender?: Gender;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface TeacherWithUser extends Teacher {
  user?: {
    id: number;
    uuid: string;
    email: string;
    username: string;
    isActive: boolean;
  };
}

export interface TeacherCredentials {
  username: string;
  temporaryPassword: string;
}

export interface TeacherResponseWithCredentials extends Teacher {
  credentials?: TeacherCredentials;
}