// src/features/academic/attendance/types/attendance.types.ts
// Espelha GET/POST /attendance/sheet do backend.

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
    PRESENT: 'Presente',
    ABSENT: 'Falta',
    LATE: 'Atraso',
    EXCUSED: 'Falta justificada',
};

export interface AttendanceSheetStudent {
    studentUuid: string;
    studentNumber: string;
    studentName: string;
    status: AttendanceStatus | null;
    remarks: string | null;
}

export interface AttendanceSheet {
    teacherAssignment: {
        uuid: string;
        teacherName: string;
        className: string;
        subjectName: string;
        academicYearName: string;
        startDate: string;
        endDate: string | null;
    };
    attendanceDate: string;
    isRecorded: boolean;
    students: AttendanceSheetStudent[];
}

export interface SaveAttendanceSheetRequest {
    teacherAssignmentUuid: string;
    attendanceDate: string;
    entries: {
        studentUuid: string;
        status: AttendanceStatus;
        remarks?: string;
    }[];
}
