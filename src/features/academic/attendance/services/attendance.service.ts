// src/features/academic/attendance/services/attendance.service.ts

import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData } from '@/shared/utils/api.utils';
import type { AttendanceSheet, SaveAttendanceSheetRequest } from '../types/attendance.types';

class AttendanceService extends ApiService {
    private basePath = '/attendance';

    constructor() {
        super('company');
    }

    async getSheet(teacherAssignmentUuid: string, attendanceDate: string): Promise<AttendanceSheet> {
        const response = await this.get<unknown>(`${this.basePath}/sheet`, {
            params: { teacherAssignmentUuid, attendanceDate },
        });
        return extractApiData<AttendanceSheet>(response);
    }

    async saveSheet(data: SaveAttendanceSheetRequest): Promise<{ created: number; updated: number; message: string }> {
        const response = await this.post<unknown>(`${this.basePath}/sheet`, data);
        return extractApiData<{ created: number; updated: number; message: string }>(response);
    }
}

export const attendanceService = new AttendanceService();
