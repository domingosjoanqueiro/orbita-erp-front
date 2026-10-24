// src/features/academic/assessments/services/assessment.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type {
    AcademicPeriod,
    AcademicTranscript,
    AssessmentContext,
    AssessmentGrid,
    AssessmentSubmission,
    AssessmentSubmissionFilters,
    ClassRanking,
    Gradebook,
    ReportCard,
    ReviewSubmissionRequest,
    ReviewSubmissionResponse,
    SaveScoresRequest,
    SaveScoresResponse,
    SubmitPeriodResponse,
    TeacherAssignmentOption,
    TeacherAcademicYear,
    ClassOption,
    EnrolledStudentOption,
    StudentOption,
} from '../types/assessment.types';

class AssessmentService extends ApiService {
    constructor() {
        super('company');
    }

    // ---------------- Atribuições (seleção) ----------------

    /*
     * Atribuições disponíveis para trabalhar.
     * Professor: só as suas (portal do professor); restantes: todas as ativas.
     */
    async getTeacherAssignments(mine = false, search?: string, academicYearUuid?: string): Promise<TeacherAssignmentOption[]> {
        if (mine) {
            // Sem ano indicado, a API devolve o ano letivo corrente do professor
            const response = await this.get<unknown>('/teacher-portal/assignments', {
                params: { academicYearUuid: academicYearUuid || undefined },
            });
            return extractApiList<TeacherAssignmentOption>(response).data;
        }
        const response = await this.get<unknown>('/teacher-assignments', {
            params: { limit: 100, isActive: true, search: search || undefined },
        });
        return extractApiList<TeacherAssignmentOption>(response).data;
    }

    // Anos letivos em que o professor autenticado tem atribuições
    async getTeacherAcademicYears(): Promise<TeacherAcademicYear[]> {
        const response = await this.get<unknown>('/teacher-portal/academic-years');
        return extractApiList<TeacherAcademicYear>(response).data;
    }

    // Alunos de uma turma onde o professor autenticado leciona
    async getMyClassStudents(classUuid: string): Promise<EnrolledStudentOption[]> {
        const response = await this.get<unknown>(`/teacher-portal/classes/${classUuid}/students`);
        return extractApiList<EnrolledStudentOption>(response).data;
    }

    async getClasses(): Promise<ClassOption[]> {
        const response = await this.get<unknown>('/classes', { params: { limit: 100, isActive: true } });
        return extractApiList<ClassOption>(response).data;
    }

    // Alunos com matrícula ativa na turma
    async getClassStudents(classUuid: string): Promise<EnrolledStudentOption[]> {
        const response = await this.get<unknown>('/enrollments', {
            params: { classUuid, limit: 100, isActive: true },
        });
        return extractApiList<EnrolledStudentOption>(response).data;
    }

    async searchStudents(search: string): Promise<StudentOption[]> {
        const response = await this.get<unknown>('/students', {
            params: { search, limit: 20 },
        });
        return extractApiList<StudentOption>(response).data;
    }

    // ---------------- Lançamento de notas ----------------

    async getContext(teacherAssignmentUuid: string): Promise<AssessmentContext> {
        const response = await this.get<unknown>('/assessment-scores/context', {
            params: { teacherAssignmentUuid },
        });
        return extractApiData<AssessmentContext>(response);
    }

    async getGrid(
        teacherAssignmentUuid: string,
        assessmentRuleUuid: string,
        academicPeriod: AcademicPeriod
    ): Promise<AssessmentGrid> {
        const response = await this.get<unknown>('/assessment-scores/grid', {
            params: { teacherAssignmentUuid, assessmentRuleUuid, academicPeriod },
        });
        return extractApiData<AssessmentGrid>(response);
    }

    async saveScores(data: SaveScoresRequest): Promise<SaveScoresResponse> {
        const response = await this.post<unknown>('/assessment-scores/save', data);
        return extractApiData<SaveScoresResponse>(response);
    }

    async submitPeriod(teacherAssignmentUuid: string, academicPeriod: AcademicPeriod): Promise<SubmitPeriodResponse> {
        const response = await this.post<unknown>('/assessment-scores/submit', { teacherAssignmentUuid, academicPeriod });
        return extractApiData<SubmitPeriodResponse>(response);
    }

    // ---------------- Validação / publicação ----------------

    async getSubmissions(filters: AssessmentSubmissionFilters): Promise<{
        data: AssessmentSubmission[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const response = await this.get<unknown>('/assessment-scores/submissions', { params: filters });
        const extracted = extractApiList<AssessmentSubmission>(response);
        return {
            data: extracted.data,
            total: extracted.total,
            page: extracted.page || filters.page || 1,
            limit: extracted.limit || filters.limit || 10,
            totalPages: extracted.totalPages || 1,
        };
    }

    async reviewSubmission(
        action: 'validate' | 'return' | 'publish',
        data: ReviewSubmissionRequest
    ): Promise<ReviewSubmissionResponse> {
        const response = await this.post<unknown>(`/assessment-scores/submissions/${action}`, data);
        return extractApiData<ReviewSubmissionResponse>(response);
    }

    // ---------------- Pautas ----------------

    async getGradebook(teacherAssignmentUuid: string, academicPeriod: AcademicPeriod): Promise<Gradebook> {
        const response = await this.get<unknown>('/gradebooks', { params: { teacherAssignmentUuid, academicPeriod } });
        return extractApiData<Gradebook>(response);
    }

    async calculateGradebook(teacherAssignmentUuid: string, academicPeriod: AcademicPeriod): Promise<{ processed: number; message: string }> {
        const response = await this.post<unknown>('/gradebooks/calculate', { teacherAssignmentUuid, academicPeriod });
        return extractApiData<{ processed: number; message: string }>(response);
    }

    // ---------------- Rankings ----------------

    async getClassRanking(classUuid: string, academicPeriod: AcademicPeriod): Promise<ClassRanking> {
        const response = await this.get<unknown>('/class-rankings', { params: { classUuid, academicPeriod } });
        return extractApiData<ClassRanking>(response);
    }

    async publishClassRanking(classUuid: string, academicPeriod: AcademicPeriod): Promise<{ message: string }> {
        const response = await this.post<unknown>('/class-rankings/publish', { classUuid, academicPeriod });
        return extractApiData<{ message: string }>(response);
    }

    // ---------------- Boletins ----------------

    async getReportCard(studentUuid: string, classUuid: string, academicPeriod: AcademicPeriod): Promise<ReportCard> {
        const response = await this.get<unknown>('/report-cards', { params: { studentUuid, classUuid, academicPeriod } });
        return extractApiData<ReportCard>(response);
    }

    async publishReportCard(studentUuid: string, classUuid: string, academicPeriod: AcademicPeriod): Promise<{ message: string }> {
        const response = await this.post<unknown>('/report-cards/publish', { studentUuid, classUuid, academicPeriod });
        return extractApiData<{ message: string }>(response);
    }

    // ---------------- Histórico escolar ----------------

    async getTranscript(studentUuid: string): Promise<AcademicTranscript> {
        const response = await this.get<unknown>('/academic-transcripts', { params: { studentUuid } });
        return extractApiData<AcademicTranscript>(response);
    }

    async publishTranscript(studentUuid: string): Promise<{ message: string }> {
        const response = await this.post<unknown>('/academic-transcripts/publish', { studentUuid });
        return extractApiData<{ message: string }>(response);
    }
}

export const assessmentService = new AssessmentService();
