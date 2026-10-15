// src/features/academic/enrollments/types/enrollment.types.ts

import type { Student, CreateStudentRequest } from '@/features/academic/students/types/student.types';

export interface Enrollment {
  studentName: string;
  className: string;
  studentNumber: string;
  gradeName: string;
  id: number;
  uuid: string;
  companyId: number;
  studentUuid: string;
  classUuid: string;
  enrollmentNumber: string;
  enrollmentDate: string;
  enrollmentStatus?: string;
  remarks?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  // Relacionamentos
  student?: Student;
  class?: {
    uuid: string;
    name: string;
    code: string;
    gradeName: string;
  };
}

export interface CreateEnrollmentRequest {
  studentUuid: string;
  classUuid: string;
  enrollmentDate: string;
  enrollmentStatus?: string;
  remarks?: string | null;
  isActive?: boolean;
}

export interface CreateEnrollmentWithStudentRequest {
  student: CreateStudentRequest;
  enrollment: {
    classUuid: string;
    enrollmentDate: string;
    enrollmentStatus?: string;
    remarks?: string | null;
    isActive?: boolean;
  };
}

// ✅ CORRIGIDO: EnrollmentResponse com enrollment e credentials
export interface EnrollmentResponse {
  enrollment: Enrollment; // ✅ obrigatório
  credentials?: {
    username: string;
    temporaryPassword: string;
  };
}

export interface EnrollmentFilters {
  search?: string;
  classUuid?: string;
  studentUuid?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface StudentSearchResult {
  uuid: string;
  studentNumber: string;
  studentName: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  documentNumber?: string | null;
  isActive: boolean;
  hasUser: boolean;
  userId?: number | null;
}

// ✅ Interface para atualizar matrícula
export interface UpdateEnrollmentRequest {
  classUuid?: string;
  enrollmentDate?: string;
  studentUuid?: string;
  status?: string;
  remarks?: string | null;
  isActive?: boolean;
}