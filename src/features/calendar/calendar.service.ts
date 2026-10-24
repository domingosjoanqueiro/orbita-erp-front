import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData } from '@/shared/utils/api.utils';

export type EventType = 'HOLIDAY' | 'EXAM' | 'MEETING' | 'EVENT' | 'TERM_START' | 'TERM_END' | 'DEADLINE' | 'OTHER';
export type Audience = 'ALL' | 'STAFF' | 'TEACHERS' | 'STUDENTS';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
    HOLIDAY: 'Feriado',
    EXAM: 'Exame / prova',
    MEETING: 'Reunião',
    EVENT: 'Evento',
    TERM_START: 'Início de período',
    TERM_END: 'Fim de período',
    DEADLINE: 'Prazo',
    OTHER: 'Outro',
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
    ALL: 'Toda a escola',
    STAFF: 'Funcionários',
    TEACHERS: 'Professores',
    STUDENTS: 'Alunos',
};

export interface CalendarEvent {
    uuid: string;
    title: string;
    description: string | null;
    eventType: EventType;
    startDate: string;
    endDate: string;
    allDay: boolean;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    audience: Audience;
    class: { uuid: string; name: string; gradeName: string } | null;
    academicYear: { uuid: string; name: string } | null;
    isDayOff: boolean;
    isNationalHoliday: boolean;
    // início/fim do ano letivo (gerado, não editável)
    virtual: boolean;
}

export interface CalendarEventInput {
    title: string;
    description?: string | null;
    eventType: EventType;
    startDate: string;
    endDate?: string | null;
    allDay: boolean;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    audience: Audience;
    classUuid?: string | null;
    isDayOff: boolean;
}

interface Envelope<T> {
    data: T;
}

class CalendarService extends ApiService {
    constructor() {
        super('company');
    }

    // fonte: calendário da escola, agenda do professor ou do aluno
    async events(from: string, to: string, source: 'school' | 'teacher' | 'student' = 'school'): Promise<CalendarEvent[]> {
        const url = source === 'teacher' ? '/teacher-portal/calendar' : source === 'student' ? '/student-portal/calendar' : '/calendar/events';
        return extractApiData<CalendarEvent[]>(await this.get<Envelope<CalendarEvent[]>>(url, { params: { from, to } }));
    }

    async upcoming(limit = 5): Promise<CalendarEvent[]> {
        return extractApiData<CalendarEvent[]>(await this.get<Envelope<CalendarEvent[]>>('/calendar/upcoming', { params: { limit } }));
    }

    async create(data: CalendarEventInput): Promise<CalendarEvent> {
        return extractApiData<CalendarEvent>(await this.post<Envelope<CalendarEvent>>('/calendar/events', data));
    }

    async update(uuid: string, data: CalendarEventInput): Promise<CalendarEvent> {
        return extractApiData<CalendarEvent>(await this.patch<Envelope<CalendarEvent>>(`/calendar/events/${uuid}`, data));
    }

    async remove(uuid: string): Promise<void> {
        await this.delete(`/calendar/events/${uuid}`);
    }

    async importHolidays(year: number): Promise<{ created: number; skipped: number }> {
        return extractApiData(await this.post<Envelope<{ created: number; skipped: number }>>('/calendar/holidays/import', { year }));
    }
}

export const calendarService = new CalendarService();

// Cores por tipo (texto do evento usa sempre a tinta normal; a cor marca o tipo)
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
    HOLIDAY: '#DC2626',
    EXAM: '#7C3AED',
    MEETING: '#2563EB',
    EVENT: '#059669',
    TERM_START: '#0891B2',
    TERM_END: '#0891B2',
    DEADLINE: '#D97706',
    OTHER: '#6B7280',
};
