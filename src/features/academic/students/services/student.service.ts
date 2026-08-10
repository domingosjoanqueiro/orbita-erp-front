import { apiClient } from '@/shared/services/api/client';
import type { 
  Student, 
  CreateStudentDTO, 
  UpdateStudentDTO, 
  StudentFilters 
} from '../types/student.types';

class StudentService {
  private basePath = '/students';

  async getAll(filters?: StudentFilters) {
    const { data } = await apiClient.get(this.basePath, { params: filters });
    return data;
  }

  async getById(id: string) {
    const { data } = await apiClient.get(`${this.basePath}/${id}`);
    return data;
  }

  async create(studentData: CreateStudentDTO) {
    const { data } = await apiClient.post(this.basePath, studentData);
    return data;
  }

  async update(id: string, studentData: UpdateStudentDTO) {
    const { data } = await apiClient.patch(`${this.basePath}/${id}`, studentData);
    return data;
  }

  async delete(id: string) {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async getEnrollments(studentId: string) {
    const { data } = await apiClient.get(`${this.basePath}/${studentId}/enrollments`);
    return data;
  }
}

export const studentService = new StudentService();