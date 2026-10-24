// src/features/academic/teachers/types/teacher.types.ts

export type Gender = 'MALE' | 'FEMALE';
import type { SystemAccess } from '@/features/academic/shared/components/SystemAccessSection';
export type { DocumentType } from '@/shared/constants/document-types';
import type { DocumentType } from '@/shared/constants/document-types';

export interface Teacher {
  id: number;
  uuid: string;
  userId?: number | null;
  teacherNumber: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName: string;
  gender: Gender;
  // "YYYY-MM-DD"
  birthDate: string;
  phone?: string | null;
  email?: string | null;
  documentType?: DocumentType | null;
  documentNumber?: string | null;
  // "YYYY-MM-DD"
  hireDate: string;
  specialization?: string | null;
  address?: string | null;
  isActive: boolean;
  user?: SystemAccess | null;
  createdAt: string;
  updatedAt: string;
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

// A API devolve o acesso (user) em todas as respostas
export type TeacherWithUser = Teacher;

export interface TeacherCredentials {
  userId: number;
  username: string;
  temporaryPassword: string;
}

export interface TeacherResponseWithCredentials extends Teacher {
  // credenciais do acesso criado com o professor (null se ficou inativo)
  portal?: TeacherCredentials | null;
}
