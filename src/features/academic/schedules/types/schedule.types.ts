export type Shift = 'MORNING' | 'AFTERNOON' | 'EVENING';

export const SHIFT_LABELS: Record<Shift, string> = {
    MORNING: 'Manhã',
    AFTERNOON: 'Tarde',
    EVENING: 'Noite',
};

export type RoomType = 'CLASSROOM' | 'LABORATORY' | 'COMPUTER_LAB' | 'LIBRARY' | 'SPORTS' | 'AUDITORIUM' | 'OTHER';

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
    CLASSROOM: 'Sala de aula',
    LABORATORY: 'Laboratório',
    COMPUTER_LAB: 'Sala de informática',
    LIBRARY: 'Biblioteca',
    SPORTS: 'Desporto / Pavilhão',
    AUDITORIUM: 'Auditório',
    OTHER: 'Outro',
};

export interface Room {
    uuid: string;
    code: string;
    name: string;
    roomType: RoomType;
    capacity: number | null;
    location: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface RoomInput {
    code: string;
    name: string;
    roomType: RoomType;
    capacity: number | null;
    location?: string | null;
    notes?: string | null;
    isActive?: boolean;
}

export interface TimeSlot {
    uuid: string;
    shift: Shift;
    name: string;
    sequence: number;
    startTime: string;
    endTime: string;
    isBreak: boolean;
    isActive: boolean;
}

export interface TimeSlotInput {
    shift: Shift;
    name?: string | null;
    startTime: string;
    endTime: string;
    isBreak?: boolean;
    isActive?: boolean;
}

export interface GenerateTimeSlotsInput {
    shift: Shift;
    startTime: string;
    lessonMinutes: number;
    lessons: number;
    breakAfter: number;
    breakMinutes: number;
    replace: boolean;
}

export interface Weekday {
    value: number;
    name: string;
    short: string;
}

export interface ScheduleEntry {
    uuid: string;
    weekday: number;
    weekdayName: string;
    notes: string | null;
    timeSlot: { uuid: string; name: string; sequence: number; startTime: string; endTime: string };
    class: { uuid: string; name: string; gradeName: string; shift: Shift };
    teacherAssignmentUuid: string;
    subject: { uuid: string; code: string; name: string };
    teacher: { uuid: string; name: string };
    room: { uuid: string; code: string; name: string } | null;
}

export interface WeekSchedule {
    weekdays: Weekday[];
    timeSlots: TimeSlot[];
    entries: ScheduleEntry[];
    totals: { lessons: number; expected?: number };
}

export interface ClassScheduleAssignment {
    uuid: string;
    subjectUuid: string;
    subjectCode: string;
    subjectName: string;
    teacherUuid: string;
    teacherName: string;
    isClassDirector: boolean;
    weeklyWorkload: number | null;
    scheduledCount: number;
}

export interface ClassSchedule extends WeekSchedule {
    class: {
        uuid: string;
        name: string;
        gradeName: string;
        shift: Shift;
        shiftName: string;
        defaultRoom?: string | null;
        academicYearUuid?: string;
        academicYearName: string;
    };
    assignments?: ClassScheduleAssignment[];
}

export interface TeacherSchedule extends WeekSchedule {
    teacher: { name: string };
    academicYear: { uuid: string; name: string };
}

export interface RoomSchedule extends WeekSchedule {
    room: Room;
    academicYear: { uuid: string; name: string };
}

export interface ScheduleOptions {
    assignments: {
        uuid: string;
        subjectName: string;
        subjectCode: string;
        teacherName: string;
        weeklyWorkload: number | null;
        scheduledCount: number;
        teacherBusy: string | null;
    }[];
    rooms: (Room & { busy: string | null })[];
}

export interface ScheduleEntryInput {
    classUuid: string;
    weekday: number;
    timeSlotUuid: string;
    teacherAssignmentUuid: string;
    roomUuid?: string | null;
    notes?: string | null;
}
