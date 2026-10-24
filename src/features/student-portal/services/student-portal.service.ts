// src/features/student-portal/services/student-portal.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData } from '@/shared/utils/api.utils';
import type {
    AcademicPeriod,
    AttendanceStatus,
    StudentAttendance,
    StudentGrades,
    StudentProfile,
    StudentSubject,
} from '../types/student-portal.types';

class StudentPortalService extends ApiService {
    private basePath = '/student-portal';

    constructor() {
        super('company');
    }

    async profile(): Promise<StudentProfile> {
        return extractApiData<StudentProfile>(await this.get<unknown>(`${this.basePath}/me`));
    }

    async subjects(): Promise<StudentSubject[]> {
        return extractApiData<StudentSubject[]>(await this.get<unknown>(`${this.basePath}/subjects`)) ?? [];
    }

    async grades(period?: AcademicPeriod): Promise<StudentGrades> {
        return extractApiData<StudentGrades>(
            await this.get<unknown>(`${this.basePath}/grades`, { params: { period } })
        );
    }

    async attendance(params: { page?: number; limit?: number; status?: AttendanceStatus } = {}): Promise<StudentAttendance> {
        return extractApiData<StudentAttendance>(
            await this.get<unknown>(`${this.basePath}/attendance`, { params })
        );
    }
}

export const studentPortalService = new StudentPortalService();
