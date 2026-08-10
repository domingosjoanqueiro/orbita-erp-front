export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  document: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  userId?: string;
  user?: {
    id: string;
    email: string;
    isActive: boolean;
  };
  enrollments?: Enrollment[];
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  status: 'active' | 'inactive' | 'pending' | 'completed';
  enrollmentDate: string;
  completionDate?: string;
  grade?: number;
  class?: {
    id: string;
    name: string;
    subject: string;
  };
}

export interface CreateStudentDTO {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  document: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  roleId: string;
  companyId: string;
}

export interface UpdateStudentDTO {
  name?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  document?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
}

export interface StudentFilters {
  search?: string;
  status?: string;
  classId?: string;
  page?: number;
  limit?: number;
}