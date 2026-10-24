// src/app/(dashboard)/finance/expenses/page.tsx

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Ban, Banknote, Edit, FolderPlus, ListChecks, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { useToast } from '@/shared/contexts/ToastContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { financeService } from '@/features/finance/services/finance.service';
import { EmptyBox, FilterBar, FinancePage, LoadingRows, TableCard, ActionButton } from '@/features/finance/components/FinancePageKit';
import { dashboardStyles as dash, KpiTile } from '@/features/dashboard-kit/DashboardKit';
import { PAYMENT_METHOD_LABELS, type Expense, type ExpenseCategory, type ListResult, type PaymentMethod } from '@/features/finance/types/finance.types';
import { firstOfMonthIso, formatMoney, parseAmount, todayIso } from '@/features/finance/utils/format';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import styles from '@/features/finance/components/finance.module.css';

const EXPENSE_DEFAULTS = { search: '', from: firstOfMonthIso(), to: todayIso(), categoryUuid: '' };

export default function ExpensesPage() {
    const { hasPermission } = usePermission();
    const canManage = hasPermission('finance.manage');
    const canVoid = hasPermission('finance.void');
    const { showSuccess, showError } = useToast();

    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [filters, setFilters] = useState(EXPENSE_DEFAULTS);
    const debounced = useDebounce(filters.search.trim(), 400);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [result, setResult] = useState<ListResult<Expense> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Expense> | null>(null);
    const [voiding, setVoiding] = useState<Expense | null>(null);
    const [managingCategories, setManagingCategories] = useState(false);
    const dirty = JSON.stringify(filters) !== JSON.stringify(EXPENSE_DEFAULTS);
    const set = (changes: Partial<typeof EXPENSE_DEFAULTS>) => setFilters(prev => ({ ...prev, ...changes }));

    const loadCategories = useCallback(() => financeService.expenseCategories().then(setCategories).catch(() => setCategories([])), []);
    const load = useCallback(async () => {
        try {
            setError(null);
            setResult(await financeService.expenses({ page, limit, from: filters.from, to: filters.to, categoryUuid: filters.categoryUuid, search: debounced }));
        } catch (err) {
            setError(getApiErrorMessage(err, 'Não foi possível carregar as despesas.'));
        }
    }, [page, limit, filters.from, filters.to, filters.categoryUuid, debounced]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);
    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        setPage(1);
    }, [filters.from, filters.to, filters.categoryUuid, debounced]);

    const meta = result?.meta;
    const validCount = result ? result.data.filter(item => item.status === 'VALID').length : 0;

    return (
        <FinancePage
            title="Despesas"
            subtitle="Saídas de dinheiro da escola"
            icon={<Banknote size={24} />}
            actions={
                canManage && (
                    <>
                        <Button variant="secondary" icon={<FolderPlus size={16} />} onClick={() => setManagingCategories(true)}>
                            Categorias
                        </Button>
                        <Button icon={<Plus size={16} />} onClick={() => setForm({ expenseDate: todayIso(), method: 'CASH' })}>
                            Nova despesa
                        </Button>
                    </>
                )
            }
        >
            <div className={dash.kpis}>
                <KpiTile tone="orange" label="Total gasto" icon={<Banknote size={18} />} value={meta ? formatMoney(meta.totalAmount ?? 0) : '…'} foot={<span>{formatDisplayDate(filters.from)} – {formatDisplayDate(filters.to)}</span>} />
                <KpiTile tone="orange" label="Despesas" icon={<ListChecks size={18} />} value={meta ? String(meta.total) : '…'} foot={<span>{validCount} válida(s) nesta página</span>} />
                <KpiTile
                    tone="pink" label="Maior categoria"
                    icon={<FolderPlus size={18} />}
                    value={meta?.topCategory ? meta.topCategory.name : '—'}
                    foot={<span>{meta?.topCategory ? formatMoney(meta.topCategory.total) : 'Sem despesas no período'}</span>}
                />
            </div>

            <FilterBar onClear={() => setFilters(EXPENSE_DEFAULTS)} active={dirty}>
                <label className={`${schedules.field} ${styles.filterSearch}`}>
                    <span className={schedules.fieldLabel}>Pesquisar</span>
                    <input className={schedules.input} value={filters.search} onChange={e => set({ search: e.target.value })} placeholder="Descrição, fornecedor ou referência" />
                </label>
                <label className={schedules.field}>
                    <span className={schedules.fieldLabel}>De</span>
                    <input type="date" className={schedules.input} value={filters.from} max={filters.to} onChange={e => set({ from: e.target.value })} />
                </label>
                <label className={schedules.field}>
                    <span className={schedules.fieldLabel}>Até</span>
                    <input type="date" className={schedules.input} value={filters.to} min={filters.from} onChange={e => set({ to: e.target.value })} />
                </label>
                <label className={schedules.field}>
                    <span className={schedules.fieldLabel}>Categoria</span>
                    <select className={schedules.nativeSelect} value={filters.categoryUuid} onChange={e => set({ categoryUuid: e.target.value })}>
                        <option value="">Todas</option>
                        {categories.map(category => (
                            <option key={category.uuid} value={category.uuid}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </label>
            </FilterBar>

            {error && <div className={styles.card} role="alert">{error}</div>}

            <TableCard
                title="Despesas"
                hint={meta ? `${meta.total} resultado(s)` : undefined}
                footer={
                    result && result.meta.total > 0 ? (
                        <Pagination
                            page={page}
                            totalPages={result.meta.totalPages}
                            total={result.meta.total}
                            limit={limit}
                            onPageChange={setPage}
                            onLimitChange={value => {
                                setLimit(value);
                                setPage(1);
                            }}
                            itemLabel="despesas"
                        />
                    ) : undefined
                }
            >
                {!result ? (
                    <LoadingRows />
                ) : result.data.length === 0 ? (
                    <EmptyBox
                        icon={<Banknote size={24} />}
                        title={dirty ? 'Nenhuma despesa com estes filtros' : 'Nenhuma despesa no período'}
                        text="Registe aqui as contas de energia e água, material, manutenção, salários pagos e outras saídas."
                        action={
                            canManage && (
                                <Button icon={<Plus size={16} />} onClick={() => setForm({ expenseDate: todayIso(), method: 'CASH' })}>
                                    Nova despesa
                                </Button>
                            )
                        }
                    />
                ) : (
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Categoria</th>
                                <th>Forma</th>
                                <th className={styles.right}>Valor</th>
                                <th>Estado</th>
                                {(canManage || canVoid) && <th className={styles.right}>Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.map(expense => (
                                <tr key={expense.uuid} className={expense.status === 'VOIDED' ? styles.rowMuted : undefined}>
                                    <td>{formatDisplayDate(expense.expenseDate)}</td>
                                    <td>
                                        <span className={styles.personName}>{expense.description}</span>
                                        {expense.supplier && <span className={styles.cellSub}>{expense.supplier}</span>}
                                    </td>
                                    <td>{expense.category ? <span className={styles.monthChip}>{expense.category.name}</span> : '—'}</td>
                                    <td>
                                        {expense.methodLabel}
                                        {expense.reference && <span className={styles.cellSub}>{expense.reference}</span>}
                                    </td>
                                    <td className={`${styles.right} ${styles.amountStrong}`}>{formatMoney(expense.amount)}</td>
                                    <td>
                                        {expense.status === 'VOIDED' ? (
                                            <span className={`${styles.pill} ${styles.pillCancelled}`} title={expense.voidedReason ?? ''}>
                                                Anulada
                                            </span>
                                        ) : (
                                            <span className={`${styles.pill} ${styles.pillPaid}`}>Válida</span>
                                        )}
                                    </td>
                                    {(canManage || canVoid) && (
                                        <td>
                                            {expense.status === 'VALID' && (
                                                <div className={styles.rowActionsRight}>
                                                    {canManage && (
                                                        <ActionButton tone="blue" icon={<Edit size={14} />} onClick={() => setForm(expense)}>
                                                            Editar
                                                        </ActionButton>
                                                    )}
                                                    {canVoid && (
                                                        <ActionButton tone="red" icon={<Ban size={14} />} onClick={() => setVoiding(expense)}>
                                                            Anular
                                                        </ActionButton>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </TableCard>

            {form && (
                <ExpenseDialog
                    initial={form}
                    categories={categories.filter(category => category.isActive || category.uuid === form.category?.uuid)}
                    onClose={() => setForm(null)}
                    onSaved={() => {
                        setForm(null);
                        load();
                        loadCategories();
                    }}
                />
            )}
            {voiding && (
                <VoidExpenseDialog
                    expense={voiding}
                    onClose={() => setVoiding(null)}
                    onDone={() => {
                        setVoiding(null);
                        load();
                    }}
                />
            )}
            {managingCategories && (
                <CategoriesDialog
                    categories={categories}
                    onClose={() => setManagingCategories(false)}
                    onChanged={loadCategories}
                    showError={showError}
                    showSuccess={showSuccess}
                />
            )}
        </FinancePage>
    );
}

const ExpenseDialog: React.FC<{ initial: Partial<Expense>; categories: ExpenseCategory[]; onClose: () => void; onSaved: () => void }> = ({ initial, categories, onClose, onSaved }) => {
    const { showSuccess, showError } = useToast();
    const [description, setDescription] = useState(initial.description ?? '');
    const [categoryUuid, setCategoryUuid] = useState(initial.category?.uuid ?? '');
    const [supplier, setSupplier] = useState(initial.supplier ?? '');
    const [amountText, setAmountText] = useState(initial.amount ? String(initial.amount).replace('.', ',') : '');
    const [date, setDate] = useState(initial.expenseDate ?? todayIso());
    const [method, setMethod] = useState<PaymentMethod>(initial.method ?? 'CASH');
    const [reference, setReference] = useState(initial.reference ?? '');
    const [notes, setNotes] = useState(initial.notes ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const save = async () => {
        const amount = parseAmount(amountText);
        const found: Record<string, string> = {};
        if (description.trim().length < 2) found.description = 'Indique a descrição';
        if (!Number.isFinite(amount) || amount <= 0) found.amount = 'Indique um valor maior que 0';
        if (!date) found.expenseDate = 'Indique a data';
        else if (date > todayIso()) found.expenseDate = 'Não pode ser futura';
        setErrors(found);
        if (Object.keys(found).length) return;
        try {
            setSaving(true);
            const payload = {
                categoryUuid: categoryUuid || null,
                description: description.trim(),
                supplier: supplier.trim() || null,
                amount,
                expenseDate: date,
                method,
                reference: reference.trim() || null,
                notes: notes.trim() || null,
            };
            if (initial.uuid) await financeService.updateExpense(initial.uuid, payload);
            else await financeService.createExpense(payload);
            showSuccess(initial.uuid ? 'Despesa atualizada' : 'Despesa registada', `${description} · ${formatMoney(amount)}`);
            onSaved();
        } catch (err) {
            setErrors(getApiFieldErrors(err));
            showError('Não foi possível guardar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={initial.uuid ? 'Editar despesa' : 'Nova despesa'} size="lg">
            <div className={schedules.dialogBody}>
                <div className={schedules.formGrid}>
                    <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Descrição *</span>
                        <input className={schedules.input} value={description} maxLength={200} onChange={event => setDescription(event.target.value)} placeholder="Ex.: Conta de energia de setembro" />
                        {errors.description && <span className={schedules.errorText}>{errors.description}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Categoria</span>
                        <select className={schedules.nativeSelect} value={categoryUuid} onChange={event => setCategoryUuid(event.target.value)}>
                            <option value="">Sem categoria</option>
                            {categories.map(category => (
                                <option key={category.uuid} value={category.uuid}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Fornecedor</span>
                        <input className={schedules.input} value={supplier} maxLength={150} onChange={event => setSupplier(event.target.value)} />
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Valor (MT) *</span>
                        <input className={schedules.input} inputMode="decimal" value={amountText} onChange={event => setAmountText(event.target.value)} />
                        {errors.amount && <span className={schedules.errorText}>{errors.amount}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Data *</span>
                        <input type="date" className={schedules.input} value={date} max={todayIso()} onChange={event => setDate(event.target.value)} />
                        {errors.expenseDate && <span className={schedules.errorText}>{errors.expenseDate}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Forma de pagamento</span>
                        <select className={schedules.nativeSelect} value={method} onChange={event => setMethod(event.target.value as PaymentMethod)}>
                            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Referência / nº da fatura</span>
                        <input className={schedules.input} value={reference} maxLength={100} onChange={event => setReference(event.target.value)} />
                    </label>
                    <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Observações</span>
                        <input className={schedules.input} value={notes} maxLength={255} onChange={event => setNotes(event.target.value)} />
                    </label>
                </div>
                <div className={schedules.dialogActions}>
                    <div className={schedules.dialogActionsRight}>
                        <Button variant="secondary" onClick={onClose} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={save} isLoading={saving}>
                            Guardar
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const VoidExpenseDialog: React.FC<{ expense: Expense; onClose: () => void; onDone: () => void }> = ({ expense, onClose, onDone }) => {
    const { showSuccess, showError } = useToast();
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const save = async () => {
        try {
            setSaving(true);
            await financeService.voidExpense(expense.uuid, reason.trim());
            showSuccess('Despesa anulada', expense.description);
            onDone();
        } catch (err) {
            showError('Não foi possível anular', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };
    return (
        <Modal isOpen onClose={onClose} title="Anular despesa" size="md">
            <div className={schedules.dialogBody}>
                <p className={styles.muted}>
                    “{expense.description}” ({formatMoney(expense.amount)}) deixa de contar nos totais. Fica no histórico como anulada.
                </p>
                <label className={schedules.field} style={{ maxWidth: 'none' }}>
                    <span className={schedules.fieldLabel}>Motivo *</span>
                    <input className={schedules.input} value={reason} maxLength={255} onChange={event => setReason(event.target.value)} />
                </label>
                <div className={schedules.dialogActions}>
                    <div className={schedules.dialogActionsRight}>
                        <Button variant="secondary" onClick={onClose} disabled={saving}>
                            Voltar
                        </Button>
                        <Button variant="danger" onClick={save} isLoading={saving} disabled={reason.trim().length < 3}>
                            Anular despesa
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const CategoriesDialog: React.FC<{
    categories: ExpenseCategory[];
    onClose: () => void;
    onChanged: () => void;
    showError: (title: string, message: string) => void;
    showSuccess: (title: string, message: string) => void;
}> = ({ categories, onClose, onChanged, showError, showSuccess }) => {
    const [name, setName] = useState('');
    const [editing, setEditing] = useState<{ uuid: string; name: string } | null>(null);
    const [busy, setBusy] = useState(false);

    const run = async (action: () => Promise<unknown>, success: string) => {
        try {
            setBusy(true);
            await action();
            showSuccess(success, '');
            onChanged();
        } catch (err) {
            showError('Erro', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Categorias de despesa" size="md">
            <div className={schedules.dialogBody}>
                <div className={schedules.toolbar}>
                    <input className={schedules.input} style={{ flex: 1 }} value={name} maxLength={100} placeholder="Nova categoria (ex.: Energia e água)" onChange={event => setName(event.target.value)} />
                    <Button
                        icon={<Plus size={16} />}
                        disabled={busy || name.trim().length < 2}
                        onClick={() => run(async () => { await financeService.createExpenseCategory(name.trim()); setName(''); }, 'Categoria criada')}
                    >
                        Adicionar
                    </Button>
                </div>
                {categories.length === 0 ? (
                    <p className={styles.muted}>Sem categorias.</p>
                ) : (
                    categories.map(category => (
                        <div key={category.uuid} className={styles.listRow}>
                            {editing?.uuid === category.uuid ? (
                                <input className={schedules.input} style={{ flex: 1 }} value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} />
                            ) : (
                                <span>
                                    {category.name} <span className={styles.muted}>({category.expensesCount})</span>
                                    {!category.isActive && <span className={`${styles.pill} ${styles.pillCancelled}`} style={{ marginLeft: 6 }}>Inativa</span>}
                                </span>
                            )}
                            <span style={{ display: 'flex', gap: 6 }}>
                                {editing?.uuid === category.uuid ? (
                                    <ActionButton tone="blue" disabled={busy || editing.name.trim().length < 2} onClick={() => run(async () => { await financeService.updateExpenseCategory(category.uuid, { name: editing.name.trim() }); setEditing(null); }, 'Categoria atualizada')}>
                                        Guardar
                                    </ActionButton>
                                ) : (
                                    <ActionButton tone="blue" icon={<Edit size={14} />} aria-label="Editar" onClick={() => setEditing({ uuid: category.uuid, name: category.name })} />
                                )}
                                {category.expensesCount > 0 ? (
                                    <ActionButton tone="blue" disabled={busy} onClick={() => run(() => financeService.updateExpenseCategory(category.uuid, { name: category.name, isActive: !category.isActive }), category.isActive ? 'Categoria desativada' : 'Categoria ativada')}>
                                        {category.isActive ? 'Desativar' : 'Ativar'}
                                    </ActionButton>
                                ) : (
                                    <ActionButton tone="red" icon={<Trash2 size={14} />} aria-label="Remover" disabled={busy} onClick={() => run(() => financeService.removeExpenseCategory(category.uuid), 'Categoria removida')} />
                                )}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
};
