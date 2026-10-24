// src/features/academic/assessments/types/assessment.types.ts
// Espelham os DTOs de assessment-scores, gradebooks, report-cards,
// class-rankings e academic-transcripts do backend.

export type AcademicPeriod = 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'FINAL';

export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'VALIDATED' | 'PUBLISHED' | 'RETURNED';

export type AssessmentWorkflow = 'DIRECT' | 'SUBMISSION' | 'VALIDATION';

export const ACADEMIC_PERIOD_LABELS: Record<AcademicPeriod, string> = {
    FIRST: '1º Período',
    SECOND: '2º Período',
    THIRD: '3º Período',
    FOURTH: '4º Período',
    FINAL: 'Final',
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
    DRAFT: 'Rascunho',
    SUBMITTED: 'Submetido',
    VALIDATED: 'Validado',
    PUBLISHED: 'Publicado',
    RETURNED: 'Devolvido',
};

export const WORKFLOW_LABELS: Record<AssessmentWorkflow, string> = {
    DIRECT: 'Publicação direta',
    SUBMISSION: 'Submissão',
    VALIDATION: 'Submissão e validação',
};

export interface AssessmentRuleSummary {
    uuid: string;
    code: string;
    name: string;
    sequence: number;
    weight: number;
    maximumScore: number;
}

export interface AssessmentPeriodState {
    academicPeriod: AcademicPeriod;
    displayName: string;
    status: SubmissionStatus | null;
    isEditable: boolean;
    returnedReason: string | null;
    // notas ainda por lançar no período (todas as avaliações × alunos)
    missingScores?: number;
    submittedAt: string | null;
    publishedAt: string | null;
}

export interface AssessmentContext {
    teacherAssignment: {
        uuid: string;
        teacherName: string;
        className: string;
        gradeName: string;
        subjectName: string;
        academicYearName: string;
        programUuid: string;
        programName: string;
    };
    workflow: AssessmentWorkflow;
    publishMode: 'MANUAL' | 'AUTOMATIC';
    allowTeacherEditAfterSubmission: boolean;
    totalWeight: number;
    assessmentRules: AssessmentRuleSummary[];
    periods: AssessmentPeriodState[];
}

export interface AssessmentGridStudent {
    studentUuid: string;
    studentNumber: string;
    studentName: string;
    score: number | null;
    remarks: string | null;
}

export interface AssessmentGrid {
    teacherAssignment: {
        uuid: string;
        teacherName: string;
        className: string;
        subjectName: string;
    };
    assessmentRule: AssessmentRuleSummary;
    academicPeriod: AcademicPeriod;
    submissionStatus: SubmissionStatus | null;
    isEditable: boolean;
    students: AssessmentGridStudent[];
}

export interface SaveScoresRequest {
    teacherAssignmentUuid: string;
    assessmentRuleUuid: string;
    academicPeriod: AcademicPeriod;
    scores: {
        studentUuid: string;
        score: number;
        remarks?: string;
    }[];
}

export interface SaveScoresResponse {
    saved: number;
    updated: number;
}

export interface SubmitPeriodResponse {
    workflow: AssessmentWorkflow;
    status: SubmissionStatus;
    message: string;
    missingScores: number;
}

export interface AssessmentSubmission {
    uuid: string;
    academicPeriod: AcademicPeriod;
    status: SubmissionStatus;
    submittedAt: string | null;
    validatedAt: string | null;
    publishedAt: string | null;
    returnedReason: string | null;
    teacherAssignmentUuid: string;
    teacherName: string;
    className: string;
    gradeName: string;
    subjectName: string;
    academicYearName: string;
}

export interface AssessmentSubmissionFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: SubmissionStatus;
    academicPeriod?: AcademicPeriod;
}

export interface ReviewSubmissionRequest {
    teacherAssignmentUuid: string;
    academicPeriod: AcademicPeriod;
    reason?: string;
}

export interface ReviewSubmissionResponse {
    status: SubmissionStatus;
    message: string;
}

// ---------------- Pautas ----------------

export interface GradebookAssessment {
    assessmentRuleUuid: string;
    code: string;
    name: string;
    sequence: number;
    weight: number;
    maximumScore: number;
    score: number | null;
}

export interface GradebookStudent {
    studentUuid: string;
    studentNumber: string;
    studentName: string;
    assessments: GradebookAssessment[];
    finalScore: number;
    grade: string | null;
    isApproved: boolean | null;
    isClosed: boolean;
}

export interface Gradebook {
    teacherAssignment: {
        uuid: string;
        teacherName: string;
        className: string;
        subjectName: string;
    };
    academicPeriod: AcademicPeriod;
    submissionStatus: SubmissionStatus | null;
    totalWeight: number;
    isClosed: boolean;
    students: GradebookStudent[];
}

// ---------------- Rankings ----------------

export interface ClassRankingSubject {
    subjectUuid: string;
    subjectName: string;
    teacherName: string;
    finalScore: number | null;
    grade: string | null;
}

export interface ClassRankingStudent {
    studentUuid: string;
    enrollmentNumber: string;
    studentName: string;
    average: number;
    rank: number;
    isApproved: boolean;
    subjects: ClassRankingSubject[];
}

export interface ClassRanking {
    classUuid: string;
    className: string;
    academicPeriod: AcademicPeriod;
    published: boolean;
    publishedAt: string | null;
    generatedAt: string;
    students: ClassRankingStudent[];
}

// ---------------- Boletins ----------------

export interface ReportCardSubject {
    subjectUuid: string;
    subjectCode: string;
    subjectName: string;
    assessments: {
        assessmentRuleUuid: string;
        code: string;
        name: string;
        score: number | null;
        maximumScore: number;
        weight: number;
    }[];
    finalScore: number | null;
    grade: string | null;
    isApproved: boolean | null;
}

export interface ReportCard {
    student: {
        uuid: string;
        studentNumber: string;
        fullName: string;
        className: string;
        academicPeriod: AcademicPeriod;
    };
    subjects: ReportCardSubject[];
    published: boolean;
    publishedAt: string | null;
    generatedAt: string;
}

// ---------------- Histórico escolar ----------------

export interface AcademicTranscriptSubject {
    subjectUuid: string;
    subjectName: string;
    className: string;
    academicPeriod: AcademicPeriod;
    finalScore: number | null;
    grade: string | null;
    isApproved: boolean | null;
}

export interface AcademicTranscriptYear {
    academicYearUuid: string;
    academicYearName: string;
    average: number;
    isApproved: boolean;
    subjects: AcademicTranscriptSubject[];
}

export interface AcademicTranscript {
    studentUuid: string;
    studentName: string;
    enrollmentNumber: string | null;
    published: boolean;
    publishedAt: string | null;
    generatedAt: string;
    years: AcademicTranscriptYear[];
}

// ---------------- Seleções ----------------

export interface TeacherAssignmentOption {
    uuid: string;
    isClassDirector?: boolean;
    studentsCount?: number;
    teacherName: string;
    className: string;
    classUuid: string;
    gradeName: string;
    subjectName: string;
    academicYearName: string;
    academicYearUuid: string;
}

export interface TeacherAcademicYear {
    uuid: string;
    name: string;
    startDate: string | null;
    endDate: string | null;
    assignmentsCount: number;
    isCurrent: boolean;
}

export interface ClassOption {
    uuid: string;
    name: string;
    gradeName: string;
    academicYearName: string;
}

export interface EnrolledStudentOption {
    uuid?: string;
    enrollmentNumber: string;
    studentUuid: string;
    studentNumber: string;
    studentName: string;
    classUuid?: string;
    className?: string;
}

export interface StudentOption {
    uuid: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    fullName?: string;
}
