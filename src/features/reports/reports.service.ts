import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData } from '@/shared/utils/api.utils';

export interface DashboardOverview {
    academicYear: { uuid: string; name: string } | null;
    enrollmentsByMonth: { month: string; total: number }[];
    studentsByGrade: { name: string; total: number }[];
    gender: { female: number; male: number };
    attendanceByMonth: { month: string; rate: number | null; present: number; absent: number }[];
    grades: {
        total: number;
        average: number | null;
        approvalRate: number | null;
        distribution: { label: string; total: number }[];
    };
    subjects: { name: string; average: number; total: number; approvalRate: number | null }[];
}

type ClassInfo = { name: string; gradeName: string; academicYearName: string };

export interface StudentsReport {
    class: ClassInfo | null;
    academicYear: { name: string } | null;
    rows: {
        index: number;
        uuid: string;
        studentNumber: string;
        name: string;
        gender: 'MALE' | 'FEMALE' | null;
        birthDate: string | null;
        className: string;
        enrollmentNumber: string;
        enrollmentDate: string | null;
        guardian: string | null;
        phone: string | null;
    }[];
    totals: { total: number; female: number; male: number };
}

export interface AttendanceReport {
    class: ClassInfo;
    period: { from: string; to: string };
    rows: { uuid: string; studentNumber: string; name: string; present: number; late: number; absent: number; excused: number; total: number; rate: number | null }[];
    totals: { present: number; late: number; absent: number; excused: number; total: number; rate: number | null; atRisk: number };
}

export interface PerformanceReport {
    class: ClassInfo;
    academicPeriod: string;
    subjects: { name: string; code: string; average: number | null; approved: number; failed: number }[];
    rows: { uuid: string; studentNumber: string; name: string; scores: (number | null)[]; average: number | null; negatives: number }[];
    totals: { students: number; withScores: number; average: number | null; approved: number; withNegatives: number };
}

class ReportsService extends ApiService {
    constructor() {
        super('company');
    }

    async overview() {
        return extractApiData<DashboardOverview>(await this.get<any>('/reports/overview'));
    }

    async students(params: { classUuid?: string; gender?: string }) {
        return extractApiData<StudentsReport>(await this.get<any>('/reports/students', { params }));
    }

    async attendance(params: { classUuid: string; from?: string; to?: string }) {
        return extractApiData<AttendanceReport>(await this.get<any>('/reports/attendance', { params }));
    }

    async performance(params: { classUuid: string; academicPeriod: string }) {
        return extractApiData<PerformanceReport>(await this.get<any>('/reports/performance', { params }));
    }
}

export const reportsService = new ReportsService();

// CSV para Excel (separador ;, BOM UTF-8)
export function downloadCsv(filename: string, header: string[], lines: (string | number | null | undefined)[][]) {
    const csv = [header, ...lines]
        .map(line => line.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export const decimal = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value).replace('.', ','));
