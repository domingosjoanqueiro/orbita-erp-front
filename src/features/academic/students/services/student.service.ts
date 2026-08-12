import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type { 
  Student, 
  CreateStudentDTO, 
  UpdateStudentDTO, 
  StudentFilters 
} from '../types/student.types';

class StudentService extends ApiService {
  private basePath = '/students';

  constructor() {
    super('company');
  }

  async getAll(filters?: StudentFilters): Promise<{ 
    data: Student[]; 
    total: number; 
    page: number; 
    limit: number;
    totalPages: number;
  }> {
    const response = await this.get<any>(`${this.basePath}`, { params: filters });
    const extracted = extractApiList<Student>(response);
    return {
      data: extracted.data,
      total: extracted.total,
      page: extracted.page || filters?.page || 1,
      limit: extracted.limit || filters?.limit || 10,
      totalPages: extracted.totalPages || 1,
    };
  }

  async getByUuid(uuid: string): Promise<Student> {
    const response = await this.get<any>(`${this.basePath}/${uuid}`);
    return extractApiData<Student>(response);
  }

  async create(data: CreateStudentDTO): Promise<Student> {
    const response = await this.post<any>(`${this.basePath}`, data);
    return extractApiData<Student>(response);
  }

  async update(uuid: string, data: UpdateStudentDTO): Promise<Student> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
    return extractApiData<Student>(response);
  }

  async remove(uuid: string): Promise<{ success: boolean }> {
    const response = await this.delete<any>(`${this.basePath}/${uuid}`);
    return extractApiData<{ success: boolean }>(response);
  }

  async getEnrollments(studentId: string): Promise<{ data: any[]; total: number }> {
    const response = await this.get<any>(`${this.basePath}/${studentId}/enrollments`);
    return extractApiList(response);
  }

  async toggleStatus(uuid: string, isActive: boolean): Promise<Student> {
    const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
    return extractApiData<Student>(response);
  }
}

export const studentService = new StudentService();