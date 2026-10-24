import { ApiService } from '@/shared/services/api/api.service';
import { extractApiData } from '@/shared/utils/api.utils';
import type {
    Charge,
    Debtor,
    Expense,
    ExpenseCategory,
    ExpenseInput,
    FeeCategory,
    FeePlan,
    FeePlanInput,
    FeeType,
    FinanceSummary,
    ListResult,
    Payment,
    PaymentInput,
    Receipt,
    StudentAccount,
} from '../types/finance.types';

interface Envelope<T> {
    data: T;
}

type Params = Record<string, string | number | boolean | undefined>;

// Remove filtros vazios
const clean = (params: Params) =>
    Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== '' && value !== null));

class FinanceService extends ApiService {
    private base = '/finance';

    constructor() {
        super('company');
    }

    private async list<T>(path: string, params: Params): Promise<ListResult<T>> {
        return this.get<ListResult<T>>(`${this.base}${path}`, { params: clean(params) });
    }

    private async data<T>(promise: Promise<Envelope<T>>): Promise<T> {
        return extractApiData<T>(await promise);
    }

    // ---------- Tipos de cobrança ----------
    async feeTypes(onlyActive = false): Promise<FeeType[]> {
        return this.data(this.get<Envelope<FeeType[]>>(`${this.base}/fee-types`, { params: onlyActive ? { active: 'true' } : {} }));
    }
    createFeeType(data: { code: string; name: string; category: FeeCategory; isRecurring: boolean; defaultAmount: number; description?: string | null; isActive?: boolean }) {
        return this.data(this.post<Envelope<FeeType>>(`${this.base}/fee-types`, data));
    }
    updateFeeType(uuid: string, data: Parameters<FinanceService['createFeeType']>[0]) {
        return this.data(this.patch<Envelope<FeeType>>(`${this.base}/fee-types/${uuid}`, data));
    }
    async removeFeeType(uuid: string) {
        await this.delete(`${this.base}/fee-types/${uuid}`);
    }

    // ---------- Tabela de propinas ----------
    feePlans(academicYearUuid?: string): Promise<FeePlan[]> {
        return this.data(this.get<Envelope<FeePlan[]>>(`${this.base}/fee-plans`, { params: clean({ academicYearUuid }) }));
    }
    createFeePlan(data: FeePlanInput) {
        return this.data(this.post<Envelope<FeePlan>>(`${this.base}/fee-plans`, data));
    }
    updateFeePlan(uuid: string, data: FeePlanInput) {
        return this.data(this.patch<Envelope<FeePlan>>(`${this.base}/fee-plans/${uuid}`, data));
    }
    async removeFeePlan(uuid: string) {
        await this.delete(`${this.base}/fee-plans/${uuid}`);
    }

    // ---------- Cobranças ----------
    charges(params: Params) {
        return this.list<Charge>('/charges', params);
    }
    generateCharges(data: { academicYearUuid: string; gradeUuid?: string | null; studentUuid?: string | null; untilMonth?: string | null }) {
        return this.data(this.post<Envelope<{ created: number; skipped: number; students: number; totalAmount: number }>>(`${this.base}/charges/generate`, data));
    }
    createCharge(data: { studentUuid: string; feeTypeUuid: string; description?: string | null; amount: number; dueDate: string; notes?: string | null }) {
        return this.data(this.post<Envelope<Charge>>(`${this.base}/charges`, data));
    }
    discountCharge(uuid: string, discount: number, notes?: string | null) {
        return this.data(this.patch<Envelope<Charge>>(`${this.base}/charges/${uuid}/discount`, { discount, notes }));
    }
    cancelCharge(uuid: string, reason: string) {
        return this.data(this.post<Envelope<Charge>>(`${this.base}/charges/${uuid}/cancel`, { reason }));
    }

    // ---------- Conta do aluno ----------
    studentAccount(studentUuid: string) {
        return this.data(this.get<Envelope<StudentAccount>>(`${this.base}/students/${studentUuid}/account`));
    }

    // ---------- Pagamentos ----------
    payments(params: Params) {
        return this.list<Payment>('/payments', params);
    }
    receipt(uuid: string) {
        return this.data(this.get<Envelope<Receipt>>(`${this.base}/payments/${uuid}`));
    }
    createPayment(data: PaymentInput) {
        return this.data(this.post<Envelope<Receipt>>(`${this.base}/payments`, data));
    }
    voidPayment(uuid: string, reason: string) {
        return this.data(this.post<Envelope<Receipt>>(`${this.base}/payments/${uuid}/void`, { reason }));
    }

    // ---------- Despesas ----------
    expenseCategories(): Promise<ExpenseCategory[]> {
        return this.data(this.get<Envelope<ExpenseCategory[]>>(`${this.base}/expense-categories`));
    }
    createExpenseCategory(name: string) {
        return this.data(this.post<Envelope<ExpenseCategory>>(`${this.base}/expense-categories`, { name }));
    }
    updateExpenseCategory(uuid: string, data: { name: string; isActive?: boolean }) {
        return this.data(this.patch<Envelope<ExpenseCategory>>(`${this.base}/expense-categories/${uuid}`, data));
    }
    async removeExpenseCategory(uuid: string) {
        await this.delete(`${this.base}/expense-categories/${uuid}`);
    }
    expenses(params: Params) {
        return this.list<Expense>('/expenses', params);
    }
    createExpense(data: ExpenseInput) {
        return this.data(this.post<Envelope<Expense>>(`${this.base}/expenses`, data));
    }
    updateExpense(uuid: string, data: ExpenseInput) {
        return this.data(this.patch<Envelope<Expense>>(`${this.base}/expenses/${uuid}`, data));
    }
    voidExpense(uuid: string, reason: string) {
        return this.data(this.post<Envelope<Expense>>(`${this.base}/expenses/${uuid}/void`, { reason }));
    }

    // ---------- Relatórios ----------
    summary(from?: string, to?: string) {
        return this.data(this.get<Envelope<FinanceSummary>>(`${this.base}/summary`, { params: clean({ from, to }) }));
    }
    debtors(params: Params) {
        return this.list<Debtor>('/debtors', params);
    }

    // ---------- Portal do aluno ----------
    myAccount() {
        return this.data(this.get<Envelope<StudentAccount>>('/student-portal/finance'));
    }
}

export const financeService = new FinanceService();
