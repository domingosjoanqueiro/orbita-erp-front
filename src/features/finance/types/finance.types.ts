export type FeeCategory = 'TUITION' | 'ENROLLMENT' | 'EXAM' | 'MATERIAL' | 'UNIFORM' | 'TRANSPORT' | 'OTHER';
export type PaymentMethod = 'CASH' | 'MPESA' | 'EMOLA' | 'BANK_TRANSFER' | 'BANK_DEPOSIT' | 'CARD' | 'OTHER';
export type LateFeeType = 'NONE' | 'FIXED' | 'PERCENT';
export type ChargeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';

export const FEE_CATEGORY_LABELS: Record<FeeCategory, string> = {
    TUITION: 'Propina',
    ENROLLMENT: 'Matrícula',
    EXAM: 'Exame',
    MATERIAL: 'Material',
    UNIFORM: 'Uniforme',
    TRANSPORT: 'Transporte',
    OTHER: 'Outro',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: 'Numerário',
    MPESA: 'M-Pesa',
    EMOLA: 'e-Mola',
    BANK_TRANSFER: 'Transferência bancária',
    BANK_DEPOSIT: 'Depósito bancário',
    CARD: 'Cartão',
    OTHER: 'Outro',
};

// Formas que exigem a referência da transação
export const METHODS_WITH_REFERENCE: PaymentMethod[] = ['MPESA', 'EMOLA', 'BANK_TRANSFER', 'BANK_DEPOSIT'];

export const CHARGE_STATUS_LABELS: Record<ChargeStatus, string> = {
    PENDING: 'Por pagar',
    PARTIAL: 'Pago em parte',
    PAID: 'Pago',
    CANCELLED: 'Anulada',
};

export const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export interface FeeType {
    uuid: string;
    code: string;
    name: string;
    category: FeeCategory;
    isRecurring: boolean;
    defaultAmount: number;
    description: string | null;
    isActive: boolean;
    plansCount: number;
}

export interface FeePlan {
    uuid: string;
    academicYear: { uuid: string; name: string };
    grade: { uuid: string; name: string } | null;
    feeType: { uuid: string; name: string; category: FeeCategory; isRecurring: boolean };
    amount: number;
    months: number[];
    dueDay: number | null;
    dueDate: string | null;
    lateFeeType: LateFeeType;
    lateFeeValue: number;
    graceDays: number;
    isActive: boolean;
    chargesCount: number;
}

export interface FeePlanInput {
    academicYearUuid: string;
    gradeUuid: string | null;
    feeTypeUuid: string;
    amount: number;
    months: number[];
    dueDay: number | null;
    dueDate: string | null;
    lateFeeType: LateFeeType;
    lateFeeValue: number;
    graceDays: number;
    isActive?: boolean;
}

export interface Charge {
    uuid: string;
    description: string;
    feeType: { uuid: string; name: string; category: FeeCategory };
    referenceMonth: string | null;
    academicYear: { uuid: string; name: string } | null;
    student: { uuid: string; name: string; number: string };
    class: { uuid: string; name: string; gradeName: string } | null;
    amount: number;
    discount: number;
    net: number;
    paidAmount: number;
    finesPaid: number;
    balance: number;
    fineDue: number;
    totalDue: number;
    dueDate: string;
    status: ChargeStatus;
    isOverdue: boolean;
    daysOverdue: number;
    lateFee: { type: LateFeeType; value: number; graceDays: number };
    notes: string | null;
    cancelledReason: string | null;
}

export interface PaymentSummary {
    uuid: string;
    receiptNumber: string;
    paymentDate: string;
    method: PaymentMethod;
    methodLabel: string;
    reference: string | null;
    amount: number;
    finesAmount: number;
    status: 'VALID' | 'VOIDED';
    voidedReason: string | null;
}

export interface Payment extends PaymentSummary {
    student: { uuid: string; name: string; number: string };
    notes: string | null;
    receivedBy: string | null;
    createdAt: string;
}

export interface Receipt extends Payment {
    class: { name: string; gradeName: string; academicYearName: string } | null;
    items: { chargeUuid: string; description: string; referenceMonth: string | null; dueDate: string; amount: number; fineAmount: number; total: number }[];
    company: {
        name: string;
        legalName: string | null;
        taxNumber: string | null;
        email: string | null;
        phone: string | null;
        address: string | null;
        logo: string | null;
        currency: string;
    };
}

export interface StudentAccount {
    student: { uuid: string; name: string; number: string; isActive: boolean };
    enrollment: { className: string; gradeName: string; academicYearUuid: string; academicYearName: string } | null;
    totals: {
        balance: number;
        fines: number;
        totalDue: number;
        overdue: number;
        overdueCount: number;
        paidThisYear: number;
        nextDue: Charge | null;
    };
    charges: Charge[];
    payments: PaymentSummary[];
}

export interface PaymentInput {
    studentUuid: string;
    paymentDate: string;
    method: PaymentMethod;
    reference?: string | null;
    amount: number;
    chargeUuids?: string[];
    notes?: string | null;
}

export interface ExpenseCategory {
    uuid: string;
    name: string;
    isActive: boolean;
    expensesCount: number;
}

export interface Expense {
    uuid: string;
    category: { uuid: string; name: string } | null;
    description: string;
    supplier: string | null;
    amount: number;
    expenseDate: string;
    method: PaymentMethod;
    methodLabel: string;
    reference: string | null;
    notes: string | null;
    status: 'VALID' | 'VOIDED';
    createdBy: string | null;
    voidedReason: string | null;
}

export interface ExpenseInput {
    categoryUuid: string | null;
    description: string;
    supplier: string | null;
    amount: number;
    expenseDate: string;
    method: PaymentMethod;
    reference: string | null;
    notes: string | null;
}

export interface FinanceSummary {
    period: { from: string; to: string };
    previous: { from: string; to: string; collected: number; expenses: number };
    collected: { total: number; fines: number; count: number };
    billed: { total: number; paid: number; rate: number | null };
    expenses: { total: number; byCategory: { name: string; total: number }[] };
    balance: number;
    outstanding: { total: number; students: number };
    overdue: { total: number; students: number };
    byMethod: { method: PaymentMethod; label: string; total: number; count: number }[];
    outstandingByGrade: { name: string; total: number; overdue: number }[];
    monthly: { month: string; collected: number; expenses: number; billed: number }[];
}

export interface Debtor {
    student: { uuid: string; name: string; number: string };
    class: { uuid: string; name: string; gradeName: string } | null;
    charges: number;
    balance: number;
    fines: number;
    total: number;
    oldestDueDate: string;
    maxDaysOverdue: number;
}

export interface ListResult<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        totalAmount?: number;
        // cobranças
        totals?: { net: number; due: number; overdue: number; overdueCount: number; students: number };
        // recibos
        voidedCount?: number;
        finesAmount?: number;
        // despesas
        topCategory?: { name: string; total: number } | null;
    };
}
