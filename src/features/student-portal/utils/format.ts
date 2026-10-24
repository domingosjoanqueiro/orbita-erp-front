// src/features/student-portal/utils/format.ts

import type { AttendanceStatus } from '../types/student-portal.types';

const LOCALE = 'pt-PT';

// Datas "YYYY-MM-DD" interpretadas como data local (sem fuso)
function parseDate(value: string): Date {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toDate(value: string): Date {
    return value.length <= 10 ? parseDate(value) : new Date(value);
}

export function formatDate(value: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
    if (!value) return '—';
    const date = toDate(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(LOCALE, options ?? { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatScore(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

export function initials(name: string | null | undefined): string {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    const first = parts[0][0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
}

export function greeting(date = new Date()): string {
    const hour = date.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
}

// Escala 0–20: aprovação a partir de 10
export type Tone = 'excellent' | 'good' | 'warning' | 'danger' | 'neutral';

export function scoreTone(value: number | null | undefined): Tone {
    if (value === null || value === undefined) return 'neutral';
    if (value >= 16) return 'excellent';
    if (value >= 12) return 'good';
    if (value >= 10) return 'warning';
    return 'danger';
}

export function rateTone(rate: number | null | undefined): Tone {
    if (rate === null || rate === undefined) return 'neutral';
    if (rate >= 90) return 'excellent';
    if (rate >= 75) return 'good';
    if (rate >= 60) return 'warning';
    return 'danger';
}

export const SHIFT_LABEL: Record<string, string> = {
    MORNING: 'Manhã',
    AFTERNOON: 'Tarde',
    EVENING: 'Noite',
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
    PRESENT: 'Presente',
    ABSENT: 'Falta',
    LATE: 'Atraso',
    EXCUSED: 'Justificada',
};

export const GENDER_LABEL: Record<string, string> = {
    MALE: 'Masculino',
    FEMALE: 'Feminino',
};

export const RELATIONSHIP_LABEL: Record<string, string> = {
    FATHER: 'Pai',
    MOTHER: 'Mãe',
    BROTHER: 'Irmão',
    SISTER: 'Irmã',
    UNCLE: 'Tio',
    AUNT: 'Tia',
    GRANDFATHER: 'Avô',
    GRANDMOTHER: 'Avó',
    OTHER: 'Outro',
};
