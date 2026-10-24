// src/features/student-portal/types/student-portal.types.ts
// Espelha o módulo student-portal do backend.

export type AcademicPeriod = 'FIRST' | 'SECOND' | 'THIRD' | 'FOURTH' | 'FINAL';

export interface StudentPeriod {
    academicPeriod: AcademicPeriod;
    displayName: string;
    hasPublished: boolean;
}

export interface StudentEnrollment {
    uuid: string;
    enrollmentNumber: string;
    enrollmentDate: string | null;
    status: string;
    classUuid: string;
    className: string;
    shift: string | null;
    room: string | null;
    gradeName: string;
    programName: string;
    academicYearName: string;
    academicYearStart: string | null;
    academicYearEnd: string | null;
    classDirectorName: string | null;
}

export interface StudentProfile {
    student: {
        uuid: string;
        studentNumber: string;
        firstName: string;
        fullName: string;
        gender: string | null;
        birthDate: string | null;
        nationality: string | null;
        address: string | null;
        phone: string | null;
        email: string | null;
        guardianName: string | null;
        guardianPhone: string | null;
        guardianRelationship: string | null;
        admissionDate: string | null;
        status: string | null;
    };
    enrollment: StudentEnrollment | null;
    periods: StudentPeriod[];
    subjectsCount: number;
}

export interface StudentSubject {
    subjectUuid: string;
    subjectCode: string;
    subjectName: string;
    teacherName: string | null;
    teacherIsClassDirector: boolean;
    weeklyWorkload: number | null;
    isMandatory: boolean;
}

export type GradeVisibility = 'PUBLISHED' | 'PROVISIONAL' | 'PENDING';

export interface StudentGradeSubject {
    subjectUuid: string;
    subjectCode: string;
    subjectName: string;
    teacherName: string | null;
    visibility: GradeVisibility;
    publishedAt: string | null;
    assessments: {
        ruleUuid: string;
        code: string;
        name: string;
        weight: number;
        maximumScore: number;
        score: number | null;
    }[];
    finalScore: number | null;
    isApproved: boolean | null;
}

export interface StudentGrades {
    period: StudentPeriod | null;
    periods: StudentPeriod[];
    subjects: StudentGradeSubject[];
    summary: {
        average: number | null;
        approvedCount: number;
        failedCount: number;
        visibleCount: number;
        totalSubjects: number;
    };
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceCounts {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    // (presenças + atrasos) / (total − justificadas), em %
    rate: number | null;
}

export interface StudentAttendance {
    summary: AttendanceCounts;
    bySubject: (AttendanceCounts & { subjectUuid: string; subjectName: string })[];
    records: {
        uuid: string;
        date: string;
        status: AttendanceStatus;
        remarks: string | null;
        subjectUuid: string;
        subjectName: string;
    }[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}
