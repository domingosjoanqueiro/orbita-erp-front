// src/features/student-portal/hooks/useStudentPortal.ts
// Dados do portal do aluno com cache (trocar de separador não volta a carregar tudo).

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { studentPortalService } from '../services/student-portal.service';
import type { AcademicPeriod, AttendanceStatus } from '../types/student-portal.types';
import { scheduleService } from '@/features/academic/schedules/services/schedule.service';
import { financeService } from '@/features/finance/services/finance.service';

export const studentPortalKeys = {
    all: ['student-portal'] as const,
    profile: () => [...studentPortalKeys.all, 'profile'] as const,
    subjects: () => [...studentPortalKeys.all, 'subjects'] as const,
    schedule: () => [...studentPortalKeys.all, 'schedule'] as const,
    finance: () => [...studentPortalKeys.all, 'finance'] as const,
    grades: (period?: AcademicPeriod) => [...studentPortalKeys.all, 'grades', period ?? 'default'] as const,
    attendance: (page: number, limit: number, status?: AttendanceStatus) =>
        [...studentPortalKeys.all, 'attendance', page, limit, status ?? 'all'] as const,
};

export function useStudentProfile() {
    return useQuery({
        queryKey: studentPortalKeys.profile(),
        queryFn: () => studentPortalService.profile(),
    });
}

export function useStudentSchedule() {
    return useQuery({
        queryKey: studentPortalKeys.schedule(),
        queryFn: () => scheduleService.studentSchedule(),
    });
}

export function useStudentFinance() {
    return useQuery({
        queryKey: studentPortalKeys.finance(),
        queryFn: () => financeService.myAccount(),
    });
}

export function useStudentSubjects() {
    return useQuery({
        queryKey: studentPortalKeys.subjects(),
        queryFn: () => studentPortalService.subjects(),
    });
}

export function useStudentGrades(period?: AcademicPeriod) {
    return useQuery({
        queryKey: studentPortalKeys.grades(period),
        queryFn: () => studentPortalService.grades(period),
        placeholderData: keepPreviousData,
    });
}

// Lista de presenças com "carregar mais" (o resumo vem em cada página)
export function useStudentAttendanceFeed(status?: AttendanceStatus, limit = 20) {
    return useInfiniteQuery({
        queryKey: [...studentPortalKeys.all, 'attendance-feed', limit, status ?? 'all'],
        queryFn: ({ pageParam }) => studentPortalService.attendance({ page: pageParam, limit, status }),
        initialPageParam: 1,
        getNextPageParam: last => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
        // Ao mudar de filtro mantém o resumo visível enquanto carrega
        placeholderData: keepPreviousData,
    });
}

export function useStudentAttendance(page = 1, status?: AttendanceStatus, limit = 20) {
    return useQuery({
        queryKey: studentPortalKeys.attendance(page, limit, status),
        queryFn: () => studentPortalService.attendance({ page, limit, status }),
        placeholderData: keepPreviousData,
    });
}
