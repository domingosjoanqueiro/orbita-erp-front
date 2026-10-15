// src/features/academic/teacher-assignments/types/teacher-assignment.types.ts

export interface TeacherAssignment {
    id: number;
    uuid: string;
    companyId: number;
    teacherUuid: string;
    classUuid: string;
    subjectUuid: string;
    academicYearUuid: string;
    startDate: string;
    endDate?: string | null;
    isClassDirector: boolean;  // ✅ Garantir que é boolean
    isActive: boolean;         // ✅ Garantir que é boolean
    teacherName: string;
    teacherNumber: string;
    subjectName: string;
    className: string;
    gradeName: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;

    // Relacionamentos
    teacher?: {
        uuid: string;
        firstName: string;
        lastName: string;
        fullName: string;
        teacherNumber: string;
        email?: string;
        phone?: string;
    };
    class?: {
        uuid: string;
        name: string;
        code: string;
        gradeName: string;
        shift: string;
    };
    gradeSubject?: {
        uuid: string;
        code: string;
        gradeName: string;
        subject_name: string;
        weekly_workload: number;
        isMandatory: boolean;
    };
}

export interface CreateTeacherAssignmentRequest {
    teacherUuid: string;
    classUuid: string;
    academicYearUuid: string;
    subjectUuid: string;
    startDate: string;
    endDate?: string | null;
    isClassDirector: boolean;  // ✅ Garantir que é boolean
    isActive?: boolean;        // ✅ Garantir que é boolean
}

export interface UpdateTeacherAssignmentRequest {
    teacherUuid?: string;
    classUuid?: string;
    academicYearUuid?: string;
    subjectUuid?: string;
    startDate?: string;
    endDate?: string | null;
    isClassDirector?: boolean; // ✅ Garantir que é boolean
    isActive?: boolean;        // ✅ Garantir que é boolean
}

export interface TeacherAssignmentFilters {
    search?: string;
    teacherUuid?: string;
    academicYearUuid?: string;
    classUuid?: string;
    subjectUuid?: string;
    isActive?: boolean;
    startDate?: string;          // ✅ Adicionado para filtro
    endDate?: string;            // ✅ Adicionado para filtro
    page?: number;
    limit?: number;
}

export interface TeacherAssignmentResponse {
    assignment: TeacherAssignment;
    message?: string;
}

// ✅ Tipos auxiliares para o formulário
export interface TeacherOption {
    uuid: string;
    label: string;
    teacherNumber: string;
    fullName: string;
}

export interface GradeOption {
    uuid: string;
    name: string;
    code: string;
    label: string;
}

export interface AcademicYearOption {
    uuid: string;
    name: string;
    year: string;
    label: string;
    isActive: boolean;
}

export interface ClassOption {
    uuid: string;
    name: string;
    code: string;
    gradeUuid: string;
    gradeName: string;
    label: string;
}

export interface GradeSubjectOption {
    uuid: string;
    label: string;
    grade_name: string;
    subject_name: string;
    weekly_workload: number;
}


// src/features/academic/teacher-assignments/types/teacher-assignment.types.ts

