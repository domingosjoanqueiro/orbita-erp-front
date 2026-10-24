import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData } from '@/shared/utils/api.utils';

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type ContractType = 'PERMANENT' | 'FIXED_TERM' | 'PART_TIME' | 'INTERNSHIP' | 'SERVICE';
export type ContractStatus = 'ACTIVE' | 'ENDED' | 'TERMINATED';
export type LeaveType = 'VACATION' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'BEREAVEMENT' | 'UNPAID' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
    PERMANENT: 'Sem termo (efetivo)',
    FIXED_TERM: 'A prazo',
    PART_TIME: 'Tempo parcial',
    INTERNSHIP: 'Estágio',
    SERVICE: 'Prestação de serviços',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
    ACTIVE: 'Ativo',
    ENDED: 'Terminado',
    TERMINATED: 'Rescindido',
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
    VACATION: 'Férias',
    SICK: 'Doença',
    MATERNITY: 'Licença de maternidade',
    PATERNITY: 'Licença de paternidade',
    BEREAVEMENT: 'Luto',
    UNPAID: 'Licença sem vencimento',
    OTHER: 'Outra ausência',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
    PENDING: 'Pendente',
    APPROVED: 'Aprovado',
    REJECTED: 'Recusado',
    CANCELLED: 'Cancelado',
};

export interface Employee {
    uuid: string;
    employeeNumber: string;
    fullName: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    gender: 'MALE' | 'FEMALE';
    birthDate: string | null;
    documentType: string | null;
    documentNumber: string | null;
    taxNumber: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    position: string;
    department: string | null;
    hireDate: string;
    employmentStatus: EmploymentStatus;
    terminationDate: string | null;
    terminationReason: string | null;
    annualLeaveDays: number;
    bankName: string | null;
    bankAccount: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    notes: string | null;
    isTeacher: boolean;
    username: string | null;
    onLeaveToday: boolean;
    activeContract: { uuid: string; contractType: ContractType; endDate: string | null; baseSalary: number } | null;
}

export interface Contract {
    uuid: string;
    employee?: { uuid: string; number: string; name: string };
    contractType: ContractType;
    startDate: string;
    endDate: string | null;
    position: string;
    baseSalary: number;
    weeklyHours: number | null;
    status: ContractStatus;
    terminationReason: string | null;
    notes: string | null;
    daysLeft?: number | null;
    expiringSoon?: boolean;
}

export interface EmployeeDetail extends Employee {
    contracts: Contract[];
    vacation: { year: number; entitlement: number; used: number; pending: number; available: number };
    recentLeaves: { uuid: string; leaveType: LeaveType; startDate: string; endDate: string; days: number; status: LeaveStatus }[];
}

export interface LeaveRequest {
    uuid: string;
    employee: { uuid: string; number: string; name: string; department: string | null; position: string };
    leaveType: LeaveType;
    leaveTypeLabel: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string | null;
    status: LeaveStatus;
    decisionNotes: string | null;
    decidedBy: string | null;
    decidedAt: string | null;
    createdAt: string;
}

export interface MyHrOverview {
    employee: { uuid: string; number: string; name: string; position: string; department: string | null };
    vacation: { year: number; entitlement: number; used: number; available: number };
    leaves: LeaveRequest[];
}

export type EmployeeInput = Omit<Employee, 'uuid' | 'employeeNumber' | 'fullName' | 'employmentStatus' | 'terminationDate' | 'terminationReason' | 'isTeacher' | 'username' | 'onLeaveToday' | 'activeContract'>;

interface ListResult<T> {
    data: T[];
    meta: { page: number; limit: number; total: number; totalPages: number; departments?: string[]; pending?: number };
}

interface Envelope<T> {
    data: T;
}

type Params = Record<string, string | number | boolean | undefined>;
const clean = (params: Params) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));

class HrService extends ApiService {
    constructor() {
        super('company');
    }

    private data<T>(promise: Promise<Envelope<T>>) {
        return promise.then(response => extractApiData<T>(response));
    }

    employees(params: Params) {
        return this.get<ListResult<Employee>>('/hr/employees', { params: clean(params) });
    }
    employee(uuid: string) {
        return this.data(this.get<Envelope<EmployeeDetail>>(`/hr/employees/${uuid}`));
    }
    createEmployee(data: EmployeeInput) {
        return this.data(this.post<Envelope<EmployeeDetail>>('/hr/employees', data));
    }
    updateEmployee(uuid: string, data: EmployeeInput) {
        return this.data(this.patch<Envelope<EmployeeDetail>>(`/hr/employees/${uuid}`, data));
    }
    terminateEmployee(uuid: string, terminationDate: string, reason: string) {
        return this.data(this.post<Envelope<EmployeeDetail>>(`/hr/employees/${uuid}/terminate`, { terminationDate, reason }));
    }
    reactivateEmployee(uuid: string) {
        return this.data(this.post<Envelope<EmployeeDetail>>(`/hr/employees/${uuid}/reactivate`));
    }
    async removeEmployee(uuid: string) {
        await this.delete(`/hr/employees/${uuid}`);
    }
    syncTeachers() {
        return this.data(this.post<Envelope<{ created: number }>>('/hr/employees/sync-teachers'));
    }

    contracts(params: Params) {
        return this.get<ListResult<Contract>>('/hr/contracts', { params: clean(params) });
    }
    createContract(data: Omit<Contract, 'uuid' | 'status' | 'terminationReason' | 'employee'> & { employeeUuid: string }) {
        return this.data(this.post<Envelope<Contract>>('/hr/contracts', data));
    }
    updateContract(uuid: string, data: Omit<Contract, 'uuid' | 'status' | 'terminationReason' | 'employee'>) {
        return this.data(this.patch<Envelope<Contract>>(`/hr/contracts/${uuid}`, data));
    }
    endContract(uuid: string, endDate: string, terminated: boolean, reason?: string | null) {
        return this.data(this.post<Envelope<Contract>>(`/hr/contracts/${uuid}/end`, { endDate, terminated, reason }));
    }

    leaves(params: Params) {
        return this.get<ListResult<LeaveRequest>>('/hr/leaves', { params: clean(params) });
    }
    createLeave(data: { employeeUuid: string; leaveType: LeaveType; startDate: string; endDate: string; reason?: string | null }) {
        return this.data(this.post<Envelope<LeaveRequest>>('/hr/leaves', data));
    }
    decideLeave(uuid: string, approve: boolean, notes?: string | null) {
        return this.data(this.post<Envelope<LeaveRequest>>(`/hr/leaves/${uuid}/decide`, { approve, notes }));
    }
    cancelLeave(uuid: string) {
        return this.data(this.post<Envelope<LeaveRequest>>(`/hr/leaves/${uuid}/cancel`));
    }

    me() {
        return this.data(this.get<Envelope<MyHrOverview>>('/hr/me'));
    }
    requestMyLeave(data: { leaveType: LeaveType; startDate: string; endDate: string; reason?: string | null }) {
        return this.data(this.post<Envelope<LeaveRequest>>('/hr/me/leaves', data));
    }
    cancelMyLeave(uuid: string) {
        return this.data(this.post<Envelope<LeaveRequest>>(`/hr/me/leaves/${uuid}/cancel`));
    }
}

export const hrService = new HrService();

export interface HrSummary {
    headcount: { total: number; teachers: number; staff: number; women: number; men: number; hiredThisYear: number; leftThisYear: number };
    payroll: { monthlyBase: number; contracts: number; withoutContract: number };
    absentToday: HrSummaryLeave[];
    upcomingLeaves: HrSummaryLeave[];
    pendingLeaves: { total: number; items: HrSummaryLeave[] };
    expiringContracts: { uuid: string; contractType: ContractType; endDate: string; daysLeft: number; position: string; employee: { uuid: string; name: string } }[];
    byDepartment: { name: string; total: number }[];
    hiresByMonth: { month: string; total: number }[];
    birthdays: { uuid: string; name: string; position: string; day: number }[];
}

export interface HrSummaryLeave {
    uuid: string;
    employee: { uuid: string; name: string; position: string };
    leaveType: LeaveType;
    leaveTypeLabel: string;
    startDate: string;
    endDate: string;
    days: number;
    status: LeaveStatus;
}

export async function getHrSummary(): Promise<HrSummary> {
    return hrSummaryService.summary();
}

class HrSummaryApi extends ApiService {
    constructor() {
        super('company');
    }
    async summary(): Promise<HrSummary> {
        return extractApiData<HrSummary>(await this.get<{ data: HrSummary }>('/hr/summary'));
    }
}

const hrSummaryService = new HrSummaryApi();
