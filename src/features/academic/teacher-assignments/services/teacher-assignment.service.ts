// src/features/academic/teacher-assignments/services/teacher-assignment.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type {
    TeacherAssignment,
    CreateTeacherAssignmentRequest,
    UpdateTeacherAssignmentRequest,
    TeacherAssignmentFilters,
    TeacherAssignmentResponse,
    TeacherOption,
    AcademicYearOption,
    GradeOption,
    ClassOption,
    GradeSubjectOption,
} from '../types/teacher-assignment.types';

class TeacherAssignmentService extends ApiService {
    private basePath = '/teacher-assignments';

    constructor() {
        super('company');
    }

    // ✅ Listar atribuições
    async getAll(filters?: TeacherAssignmentFilters): Promise<{
        data: TeacherAssignment[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const response = await this.get<any>(`${this.basePath}`, { params: filters });
        console.log('📥 TeacherAssignmentService.getAll - Resposta:', response);
        const extracted = extractApiList<TeacherAssignment>(response);
        return {
            data: extracted.data,
            total: extracted.total,
            page: extracted.page || filters?.page || 1,
            limit: extracted.limit || filters?.limit || 10,
            totalPages: extracted.totalPages || 1,
        };
    }

    // ✅ Buscar atribuição por UUID
    async getByUuid(uuid: string): Promise<TeacherAssignment> {
        const response = await this.get<any>(`${this.basePath}/${uuid}`);
        return extractApiData<TeacherAssignment>(response);
    }

    // ✅ Criar atribuição
    async create(data: CreateTeacherAssignmentRequest): Promise<TeacherAssignmentResponse> {
        console.log('📥 TeacherAssignmentService.create - Dados enviados:', data);
        const response = await this.post<any>(`${this.basePath}`, data);
        console.log('📥 TeacherAssignmentService.create - Resposta:', response);
        return extractApiData<TeacherAssignmentResponse>(response);
    }

    // ✅ Criar múltiplas atribuições (em lote)
    async createBulk(data: CreateTeacherAssignmentRequest[]): Promise<{
        success: boolean;
        assignments: TeacherAssignment[];
        total: number;
    }> {
        const response = await this.post<any>(`${this.basePath}/bulk`, { assignments: data });
        console.log('📥 TeacherAssignmentService.createBulk - Resposta:', response);
        return extractApiData<{ success: boolean; assignments: TeacherAssignment[]; total: number }>(response);
    }

    // ✅ Atualizar atribuição
    async update(uuid: string, data: UpdateTeacherAssignmentRequest): Promise<TeacherAssignment> {
        const response = await this.patch<any>(`${this.basePath}/${uuid}`, data);
        console.log('📥 TeacherAssignmentService.update - Resposta:', response);
        return extractApiData<TeacherAssignment>(response);
    }

    // ✅ Ativar/Desativar atribuição
    async toggleStatus(uuid: string, isActive: boolean): Promise<TeacherAssignment> {
        const response = await this.patch<any>(`${this.basePath}/${uuid}/status`, { isActive });
        return extractApiData<TeacherAssignment>(response);
    }

    // ✅ Remover atribuição
    async remove(uuid: string): Promise<{ success: boolean }> {
        const response = await this.delete<any>(`${this.basePath}/${uuid}`);
        return extractApiData<{ success: boolean }>(response);
    }

    // ✅ Buscar professores disponíveis
    async getAvailableTeachers(classUuid?: string, gradeSubjectUuid?: string): Promise<TeacherOption[]> {
        const params = { classUuid, gradeSubjectUuid };
        const response = await this.get<any>(`${this.basePath}/available-teachers`, { params });
        return extractApiList<TeacherOption>(response).data;
    }

    // ✅ Buscar Anos Académicos disponíveis
    async getAvailableAcademicYears(): Promise<AcademicYearOption[]> {
        const response = await this.get<any>('/academic-years', { params: { limit: 100 } });
        return extractApiList<AcademicYearOption>(response).data;
    }

    // ✅ Buscar Classes (Grades) disponíveis
    async getAvailableGrades(): Promise<GradeOption[]> {
        const response = await this.get<any>('/grades', { params: { limit: 100 } });
        return extractApiList<GradeOption>(response).data;
    }

    // ✅ Buscar Turmas (Classes) por Classe (Grade)
    async getAvailableClassesByGrade(gradeUuid: string): Promise<ClassOption[]> {
        const response = await this.get<any>(`/classes`, { params: { gradeUuid, limit: 100 } });
        return extractApiList<ClassOption>(response).data;
    }

    // ✅ Buscar todas as turmas (para compatibilidade)
    async getAvailableClasses(): Promise<ClassOption[]> {
        const response = await this.get<any>(`/classes`, { params: { limit: 100 } });
        return extractApiList<ClassOption>(response).data;
    }

    // ✅ Buscar disciplinas disponíveis por turma
    async getAvailableGradeSubjects(classUuid: string): Promise<GradeSubjectOption[]> {
        const response = await this.get<any>(`${this.basePath}/available-grade-subjects/${classUuid}`);
        console.log('📥 TeacherAssignmentService.getAvailableGradeSubjects - Resposta:', response);
        return extractApiList<GradeSubjectOption>(response).data;
    }

    // ✅ Buscar atribuições por professor
    async getByTeacher(teacherUuid: string): Promise<TeacherAssignment[]> {
        const response = await this.get<any>(`${this.basePath}/teacher/${teacherUuid}`);
        return extractApiList<TeacherAssignment>(response).data;
    }

    // ✅ Buscar atribuições por turma
    async getByClass(classUuid: string): Promise<TeacherAssignment[]> {
        const response = await this.get<any>(`${this.basePath}/class/${classUuid}`);
        return extractApiList<TeacherAssignment>(response).data;
    }
}

export const teacherAssignmentService = new TeacherAssignmentService();