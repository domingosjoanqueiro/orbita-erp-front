export interface Student {
  id: number;
  uuid: string;
  companyId: number;
  studentNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace?: string;
  nationality: string;
  province?: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  documentType?: string;
  documentNumber?: string;
  fatherFullName?: string;
  motherFullName?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  photo?: string;
  admissionDate: string;
  studentStatus: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  isActive: boolean;
  userId?: number;
  user?: {
    id: number;
    uuid: string;
    username: string;
    email: string;
    isActive: boolean;
  };
  enrollments?: Enrollment[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Enrollment {
  id: number;
  uuid: string;
  studentId: number;
  classId: number;
  enrollmentNumber: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  remarks?: string;
  isActive: boolean;
  class?: {
    id: number;
    name: string;
    grade?: {
      id: number;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentDTO {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  birthDate: string;
  birthPlace?: string;
  nationality: string;
  province?: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  documentType?: string;
  documentNumber?: string;
  fatherFullName?: string;
  motherFullName?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  admissionDate: string;
  studentStatus?: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  roleId?: number;
  companyId?: number;
}

export interface UpdateStudentDTO {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: 'MALE' | 'FEMALE';
  birthDate?: string;
  birthPlace?: string;
  nationality?: string;
  province?: string;
  district?: string;
  address?: string;
  phone?: string;
  email?: string;
  documentType?: string;
  documentNumber?: string;
  fatherFullName?: string;
  motherFullName?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
  admissionDate?: string;
  studentStatus?: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  isActive?: boolean;
}

export interface StudentFilters {
  search?: string;
  gender?: 'MALE' | 'FEMALE';
  studentStatus?: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  classId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
}