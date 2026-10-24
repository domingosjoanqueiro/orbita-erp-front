import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData, extractApiList } from '@/shared/utils/api.utils';
import type {
    ClassSchedule,
    GenerateTimeSlotsInput,
    Room,
    RoomInput,
    RoomSchedule,
    ScheduleEntry,
    ScheduleEntryInput,
    ScheduleOptions,
    Shift,
    TeacherSchedule,
    TimeSlot,
    TimeSlotInput,
} from '../types/schedule.types';

interface DataEnvelope<T> {
    data: T;
}

class ScheduleService extends ApiService {
    constructor() {
        super('company');
    }

    // ---------- Salas ----------

    async listRooms(params: { page?: number; limit?: number; search?: string; isActive?: boolean } = {}) {
        const response = await this.get<unknown>('/rooms', { params });
        return extractApiList<Room>(response);
    }

    async createRoom(data: RoomInput): Promise<Room> {
        return extractApiData<Room>(await this.post<DataEnvelope<Room>>('/rooms', data));
    }

    async updateRoom(uuid: string, data: RoomInput): Promise<Room> {
        return extractApiData<Room>(await this.patch<DataEnvelope<Room>>(`/rooms/${uuid}`, data));
    }

    async removeRoom(uuid: string): Promise<void> {
        await this.delete(`/rooms/${uuid}`);
    }

    // ---------- Tempos letivos ----------

    async listTimeSlots(shift?: Shift): Promise<TimeSlot[]> {
        const response = await this.get<DataEnvelope<TimeSlot[]>>('/time-slots', { params: shift ? { shift } : {} });
        return extractApiData<TimeSlot[]>(response);
    }

    async createTimeSlot(data: TimeSlotInput): Promise<TimeSlot> {
        return extractApiData<TimeSlot>(await this.post<DataEnvelope<TimeSlot>>('/time-slots', data));
    }

    async updateTimeSlot(uuid: string, data: TimeSlotInput): Promise<TimeSlot> {
        return extractApiData<TimeSlot>(await this.patch<DataEnvelope<TimeSlot>>(`/time-slots/${uuid}`, data));
    }

    async removeTimeSlot(uuid: string): Promise<void> {
        await this.delete(`/time-slots/${uuid}`);
    }

    async generateTimeSlots(data: GenerateTimeSlotsInput): Promise<TimeSlot[]> {
        return extractApiData<TimeSlot[]>(await this.post<DataEnvelope<TimeSlot[]>>('/time-slots/generate', data));
    }

    // ---------- Horários ----------

    async classSchedule(classUuid: string): Promise<ClassSchedule> {
        return extractApiData<ClassSchedule>(await this.get<DataEnvelope<ClassSchedule>>(`/schedules/classes/${classUuid}`));
    }

    async teacherSchedule(teacherUuid: string, academicYearUuid?: string): Promise<TeacherSchedule> {
        const response = await this.get<DataEnvelope<TeacherSchedule>>(`/schedules/teachers/${teacherUuid}`, {
            params: academicYearUuid ? { academicYearUuid } : {},
        });
        return extractApiData<TeacherSchedule>(response);
    }

    async roomSchedule(roomUuid: string, academicYearUuid?: string): Promise<RoomSchedule> {
        const response = await this.get<DataEnvelope<RoomSchedule>>(`/schedules/rooms/${roomUuid}`, {
            params: academicYearUuid ? { academicYearUuid } : {},
        });
        return extractApiData<RoomSchedule>(response);
    }

    async options(classUuid: string, weekday: number, timeSlotUuid: string, ignoreUuid?: string): Promise<ScheduleOptions> {
        const response = await this.get<DataEnvelope<ScheduleOptions>>('/schedules/options', {
            params: { classUuid, weekday, timeSlotUuid, ...(ignoreUuid ? { ignoreUuid } : {}) },
        });
        return extractApiData<ScheduleOptions>(response);
    }

    async createEntry(data: ScheduleEntryInput): Promise<ScheduleEntry> {
        return extractApiData<ScheduleEntry>(await this.post<DataEnvelope<ScheduleEntry>>('/schedules', data));
    }

    async updateEntry(uuid: string, data: Partial<Omit<ScheduleEntryInput, 'classUuid'>>): Promise<ScheduleEntry> {
        return extractApiData<ScheduleEntry>(await this.patch<DataEnvelope<ScheduleEntry>>(`/schedules/${uuid}`, data));
    }

    async removeEntry(uuid: string): Promise<void> {
        await this.delete(`/schedules/${uuid}`);
    }

    async clearClass(classUuid: string): Promise<{ removed: number }> {
        return extractApiData<{ removed: number }>(await this.delete<DataEnvelope<{ removed: number }>>(`/schedules/classes/${classUuid}`));
    }

    // ---------- Portais ----------

    async mySchedule(academicYearUuid?: string): Promise<TeacherSchedule> {
        const response = await this.get<DataEnvelope<TeacherSchedule>>('/teacher-portal/schedule', {
            params: academicYearUuid ? { academicYearUuid } : {},
        });
        return extractApiData<TeacherSchedule>(response);
    }

    async studentSchedule(): Promise<ClassSchedule | null> {
        return extractApiData<ClassSchedule | null>(await this.get<DataEnvelope<ClassSchedule | null>>('/student-portal/schedule'));
    }
}

export const scheduleService = new ScheduleService();
