// src/app/(dashboard)/finance/fees/page.tsx

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Edit, Plus, Table2, Tags, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { useToast } from '@/shared/contexts/ToastContext';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { financeService } from '@/features/finance/services/finance.service';
import { EmptyBox, FinancePage, LoadingRows, TableCard, ActionButton } from '@/features/finance/components/FinancePageKit';
import { dashboardStyles as dash, KpiTile } from '@/features/dashboard-kit/DashboardKit';
import { useFinanceLookups, type Option } from '@/features/finance/hooks/useFinanceLookups';
import {
    FEE_CATEGORY_LABELS,
    MONTHS,
    type FeeCategory,
    type FeePlan,
    type FeeType,
    type LateFeeType,
} from '@/features/finance/types/finance.types';
import { formatMoney, parseAmount } from '@/features/finance/utils/format';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import styles from '@/features/finance/components/finance.module.css';

type Tab = 'plans' | 'types';

const lateFeeText = (plan: Pick<FeePlan, 'lateFeeType' | 'lateFeeValue' | 'graceDays'>) =>
    plan.lateFeeType === 'NONE'
        ? 'Sem multa'
        : `${plan.lateFeeType === 'PERCENT' ? `${plan.lateFeeValue}%` : formatMoney(plan.lateFeeValue)} após ${plan.graceDays} dia(s)`;

export default function FeesPage() {
    const { hasPermission } = usePermission();
    const canManage = hasPermission('finance.manage');
    const { years, grades } = useFinanceLookups();
    const { showSuccess, showError } = useToast();

    const [tab, setTab] = useState<Tab>('plans');
    const [types, setTypes] = useState<FeeType[]>([]);
    const [plans, setPlans] = useState<FeePlan[] | null>(null);
    const [yearUuid, setYearUuid] = useState('');
    const [typeForm, setTypeForm] = useState<Partial<FeeType> | null>(null);
    const [planForm, setPlanForm] = useState<Partial<FeePlan> | null>(null);
    const [toDelete, setToDelete] = useState<{ kind: 'type' | 'plan'; uuid: string; name: string } | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!yearUuid && years[0]) setYearUuid(years[0].uuid);
    }, [years, yearUuid]);

    const loadTypes = useCallback(() => financeService.feeTypes().then(setTypes).catch(() => setTypes([])), []);
    const loadPlans = useCallback(async () => {
        if (!yearUuid) return;
        try {
            setPlans(await financeService.feePlans(yearUuid));
        } catch (err) {
            showError('Erro', getApiErrorMessage(err, 'Não foi possível carregar a tabela de propinas.'));
        }
    }, [yearUuid]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        loadTypes();
    }, [loadTypes]);
    useEffect(() => {
        loadPlans();
    }, [loadPlans]);

    const remove = async () => {
        if (!toDelete) return;
        try {
            setBusy(true);
            if (toDelete.kind === 'type') await financeService.removeFeeType(toDelete.uuid);
            else await financeService.removeFeePlan(toDelete.uuid);
            showSuccess('Removido', toDelete.name);
            setToDelete(null);
            await Promise.all([loadTypes(), loadPlans()]);
        } catch (err) {
            showError('Não foi possível remover', getApiErrorMessage(err, 'Tente novamente.'));
            setToDelete(null);
        } finally {
            setBusy(false);
        }
    };

    const monthly = (plans ?? []).filter(plan => plan.feeType.isRecurring && plan.isActive).map(plan => plan.amount);
    const yearName = years.find(year => year.uuid === yearUuid)?.name ?? '';

    return (
        <FinancePage
            title="Propinas"
            subtitle="Tipos de cobrança e preços por ano letivo e classe"
            icon={<Table2 size={24} />}
            actions={
                canManage &&
                (tab === 'plans' ? (
                    <Button icon={<Plus size={16} />} disabled={!types.some(type => type.isActive)} onClick={() => setPlanForm({})}>
                        Novo preço
                    </Button>
                ) : (
                    <Button icon={<Plus size={16} />} onClick={() => setTypeForm({ category: 'TUITION', isRecurring: true, isActive: true })}>
                        Novo tipo
                    </Button>
                ))
            }
        >
            <div className={dash.kpis}>
                <KpiTile tone="purple" label="Tipos de cobrança" icon={<Tags size={18} />} value={String(types.filter(type => type.isActive).length)} foot={<span>{types.filter(type => type.isRecurring && type.isActive).length} mensal(is) · {types.filter(type => !type.isRecurring && type.isActive).length} pontual(is)</span>} />
                <KpiTile tone="blue" label={`Preços ${yearName}`} icon={<Table2 size={18} />} value={plans ? String(plans.filter(plan => plan.isActive).length) : '…'} foot={<span>{plans ? plans.reduce((sum, plan) => sum + plan.chargesCount, 0) : 0} cobrança(s) emitida(s)</span>} />
                <KpiTile
                    tone="green" label="Propina mensal"
                    icon={<Wallet size={18} />}
                    value={monthly.length ? (Math.min(...monthly) === Math.max(...monthly) ? formatMoney(monthly[0]) : `${formatMoney(Math.min(...monthly))} – ${formatMoney(Math.max(...monthly))}`) : '—'}
                    foot={<span>{monthly.length ? 'Valores ativos neste ano' : 'Sem propinas mensais definidas'}</span>}
                />
            </div>

            <div className={styles.filterBar} style={{ alignItems: 'center' }}>
                <div className={styles.nav} role="tablist">
                    <button type="button" role="tab" aria-selected={tab === 'plans'} className={`${styles.navLink} ${tab === 'plans' ? styles.navActive : ''}`} onClick={() => setTab('plans')}>
                        <Table2 size={15} /> Tabela de preços
                    </button>
                    <button type="button" role="tab" aria-selected={tab === 'types'} className={`${styles.navLink} ${tab === 'types' ? styles.navActive : ''}`} onClick={() => setTab('types')}>
                        <Tags size={15} /> Tipos de cobrança
                    </button>
                </div>
                {tab === 'plans' && (
                    <label className={schedules.field} style={{ maxWidth: 200, marginLeft: 'auto' }}>
                        <span className={schedules.fieldLabel}>Ano letivo</span>
                        <select className={schedules.nativeSelect} value={yearUuid} onChange={event => setYearUuid(event.target.value)}>
                            {years.map(year => (
                                <option key={year.uuid} value={year.uuid}>
                                    {year.name}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            {tab === 'plans' ? (
                <TableCard title={`Tabela de preços ${yearName}`} hint="Um preço para uma classe concreta tem prioridade sobre “Todas as classes”. Alterar um preço não muda as cobranças já emitidas.">
                    {!plans ? (
                        <LoadingRows />
                    ) : plans.length === 0 ? (
                        <EmptyBox
                            icon={<Table2 size={24} />}
                            title="Sem preços para este ano letivo"
                            text={types.length === 0 ? 'Comece por criar os tipos de cobrança (ex.: Propina mensal, Matrícula).' : 'Defina quanto se paga por cada tipo de cobrança, para todas as classes ou por classe.'}
                            action={
                                canManage &&
                                (types.length === 0 ? (
                                    <Button icon={<Plus size={16} />} onClick={() => setTab('types')}>
                                        Criar tipos de cobrança
                                    </Button>
                                ) : (
                                    <Button icon={<Plus size={16} />} onClick={() => setPlanForm({})}>
                                        Novo preço
                                    </Button>
                                ))
                            }
                        />
                    ) : (
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Cobrança</th>
                                    <th>Classe</th>
                                    <th className={styles.right}>Valor</th>
                                    <th>Vencimento</th>
                                    <th>Multa por atraso</th>
                                    <th>Estado</th>
                                    {canManage && <th className={styles.right}>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map(plan => (
                                    <tr key={plan.uuid} className={plan.isActive ? undefined : styles.rowMuted}>
                                        <td>
                                            <span className={styles.personName}>{plan.feeType.name}</span>
                                            <span className={styles.cellSub}>{plan.chargesCount} cobrança(s) emitida(s)</span>
                                        </td>
                                        <td>{plan.grade?.name ?? 'Todas as classes'}</td>
                                        <td className={`${styles.right} ${styles.amountStrong}`}>
                                            {formatMoney(plan.amount)}
                                            {plan.feeType.isRecurring && <span className={styles.cellSub}>por mês</span>}
                                        </td>
                                        <td>
                                            {plan.feeType.isRecurring ? (
                                                <>
                                                    Dia {plan.dueDay}
                                                    <div className={styles.monthChips} style={{ marginTop: 4 }}>
                                                        {plan.months.map(m => (
                                                            <span key={m} className={styles.monthChip}>
                                                                {MONTHS[m - 1]}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                formatDisplayDate(plan.dueDate)
                                            )}
                                        </td>
                                        <td>{lateFeeText(plan)}</td>
                                        <td>
                                            <span className={`${styles.pill} ${plan.isActive ? styles.pillPaid : styles.pillCancelled}`}>{plan.isActive ? 'Ativo' : 'Inativo'}</span>
                                        </td>
                                        {canManage && (
                                            <td>
                                                <div className={styles.rowActionsRight}>
                                                    <ActionButton tone="blue" icon={<Edit size={14} />} onClick={() => setPlanForm(plan)}>
                                                        Editar
                                                    </ActionButton>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        icon={<Trash2 size={14} />}
                                                        aria-label="Remover"
                                                        onClick={() => setToDelete({ kind: 'plan', uuid: plan.uuid, name: `${plan.feeType.name} · ${plan.grade?.name ?? 'Todas'}` })}
                                                    />
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </TableCard>
            ) : (
                <TableCard title="Tipos de cobrança" hint="O que a escola cobra: propinas mensais e valores pontuais (matrícula, exames, uniforme…)">
                    {types.length === 0 ? (
                        <EmptyBox
                            icon={<Tags size={24} />}
                            title="Ainda não há tipos de cobrança"
                            text="Crie, por exemplo, “Propina mensal” (mensal) e “Taxa de matrícula” (pontual)."
                            action={
                                canManage && (
                                    <Button icon={<Plus size={16} />} onClick={() => setTypeForm({ category: 'TUITION', isRecurring: true, isActive: true })}>
                                        Novo tipo
                                    </Button>
                                )
                            }
                        />
                    ) : (
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Categoria</th>
                                    <th>Periodicidade</th>
                                    <th className={styles.right}>Valor sugerido</th>
                                    <th>Estado</th>
                                    {canManage && <th className={styles.right}>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {types.map(type => (
                                    <tr key={type.uuid} className={type.isActive ? undefined : styles.rowMuted}>
                                        <td>
                                            <span className={styles.personName}>{type.name}</span>
                                            <span className={styles.cellSub}>{type.code}</span>
                                        </td>
                                        <td>{FEE_CATEGORY_LABELS[type.category]}</td>
                                        <td>
                                            <span className={styles.monthChip}>{type.isRecurring ? 'Mensal' : 'Pontual'}</span>
                                        </td>
                                        <td className={styles.right}>{type.defaultAmount ? formatMoney(type.defaultAmount) : '—'}</td>
                                        <td>
                                            <span className={`${styles.pill} ${type.isActive ? styles.pillPaid : styles.pillCancelled}`}>{type.isActive ? 'Ativo' : 'Inativo'}</span>
                                        </td>
                                        {canManage && (
                                            <td>
                                                <div className={styles.rowActionsRight}>
                                                    <ActionButton tone="blue" icon={<Edit size={14} />} onClick={() => setTypeForm(type)}>
                                                        Editar
                                                    </ActionButton>
                                                    <ActionButton tone="red" icon={<Trash2 size={14} />} aria-label="Remover" onClick={() => setToDelete({ kind: 'type', uuid: type.uuid, name: type.name })} />
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </TableCard>
            )}

            {typeForm && (
                <FeeTypeDialog
                    initial={typeForm}
                    onClose={() => setTypeForm(null)}
                    onSaved={() => {
                        setTypeForm(null);
                        loadTypes();
                        loadPlans();
                    }}
                />
            )}
            {planForm && (
                <FeePlanDialog
                    initial={planForm}
                    years={years}
                    grades={grades}
                    types={types.filter(type => type.isActive || type.uuid === planForm.feeType?.uuid)}
                    defaultYear={yearUuid}
                    onClose={() => setPlanForm(null)}
                    onSaved={() => {
                        setPlanForm(null);
                        loadPlans();
                    }}
                />
            )}
            <ConfirmDialog
                isOpen={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={remove}
                title={toDelete?.kind === 'type' ? 'Remover tipo de cobrança' : 'Remover preço'}
                message={
                    toDelete?.kind === 'type'
                        ? `Remover "${toDelete.name}"? Só é possível se ainda não tiver cobranças emitidas (os preços deste tipo também são removidos).`
                        : `Remover o preço "${toDelete?.name}"? As cobranças já emitidas mantêm-se.`
                }
                type="danger"
                confirmText="Remover"
                isLoading={busy}
            />
        </FinancePage>
    );
}

const FeeTypeDialog: React.FC<{ initial: Partial<FeeType>; onClose: () => void; onSaved: () => void }> = ({ initial, onClose, onSaved }) => {
    const { showSuccess, showError } = useToast();
    const [code, setCode] = useState(initial.code ?? '');
    const [name, setName] = useState(initial.name ?? '');
    const [category, setCategory] = useState<FeeCategory>(initial.category ?? 'OTHER');
    const [isRecurring, setIsRecurring] = useState(initial.isRecurring ?? false);
    const [amountText, setAmountText] = useState(initial.defaultAmount ? String(initial.defaultAmount).replace('.', ',') : '');
    const [isActive, setIsActive] = useState(initial.isActive ?? true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const save = async () => {
        const amount = amountText.trim() ? parseAmount(amountText) : 0;
        const found: Record<string, string> = {};
        if (!code.trim()) found.code = 'Indique o código';
        if (name.trim().length < 2) found.name = 'Indique o nome';
        if (!Number.isFinite(amount) || amount < 0) found.defaultAmount = 'Valor inválido';
        setErrors(found);
        if (Object.keys(found).length) return;
        try {
            setSaving(true);
            const payload = { code: code.trim(), name: name.trim(), category, isRecurring, defaultAmount: amount, isActive };
            if (initial.uuid) await financeService.updateFeeType(initial.uuid, payload);
            else await financeService.createFeeType(payload);
            showSuccess(initial.uuid ? 'Tipo atualizado' : 'Tipo criado', name);
            onSaved();
        } catch (err) {
            setErrors(getApiFieldErrors(err));
            showError('Não foi possível guardar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={initial.uuid ? 'Editar tipo de cobrança' : 'Novo tipo de cobrança'} size="md">
            <div className={schedules.dialogBody}>
                <div className={schedules.formGrid}>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Código *</span>
                        <input className={schedules.input} value={code} maxLength={20} placeholder="Ex.: PROP" onChange={event => setCode(event.target.value)} />
                        {errors.code && <span className={schedules.errorText}>{errors.code}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Categoria</span>
                        <select className={schedules.nativeSelect} value={category} onChange={event => setCategory(event.target.value as FeeCategory)}>
                            {Object.entries(FEE_CATEGORY_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Nome *</span>
                        <input className={schedules.input} value={name} maxLength={100} placeholder="Ex.: Propina mensal" onChange={event => setName(event.target.value)} />
                        {errors.name && <span className={schedules.errorText}>{errors.name}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Periodicidade</span>
                        <select className={schedules.nativeSelect} value={isRecurring ? 'M' : 'P'} onChange={event => setIsRecurring(event.target.value === 'M')}>
                            <option value="M">Mensal (propinas)</option>
                            <option value="P">Pontual (matrícula, exame…)</option>
                        </select>
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Valor sugerido (MT)</span>
                        <input className={schedules.input} inputMode="decimal" value={amountText} onChange={event => setAmountText(event.target.value)} placeholder="0,00" />
                        {errors.defaultAmount && <span className={schedules.errorText}>{errors.defaultAmount}</span>}
                    </label>
                    <label className={`${schedules.checkboxRow} ${schedules.fullRow}`}>
                        <input type="checkbox" checked={isActive} onChange={event => setIsActive(event.target.checked)} />
                        Ativo
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

const FeePlanDialog: React.FC<{
    initial: Partial<FeePlan>;
    years: Option[];
    grades: Option[];
    types: FeeType[];
    defaultYear: string;
    onClose: () => void;
    onSaved: () => void;
}> = ({ initial, years, grades, types, defaultYear, onClose, onSaved }) => {
    const { showSuccess, showError } = useToast();
    const [yearUuid, setYearUuid] = useState(initial.academicYear?.uuid ?? defaultYear);
    const [gradeUuid, setGradeUuid] = useState(initial.grade?.uuid ?? '');
    const [typeUuid, setTypeUuid] = useState(initial.feeType?.uuid ?? '');
    const [amountText, setAmountText] = useState(initial.amount ? String(initial.amount).replace('.', ',') : '');
    const [months, setMonths] = useState<number[]>(initial.months ?? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    const [dueDay, setDueDay] = useState(String(initial.dueDay ?? 10));
    const [dueDate, setDueDate] = useState(initial.dueDate ?? '');
    const [lateFeeType, setLateFeeType] = useState<LateFeeType>(initial.lateFeeType ?? 'NONE');
    const [lateFeeText, setLateFeeTextValue] = useState(initial.lateFeeValue ? String(initial.lateFeeValue).replace('.', ',') : '');
    const [graceDays, setGraceDays] = useState(String(initial.graceDays ?? 5));
    const [isActive, setIsActive] = useState(initial.isActive ?? true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const type = types.find(item => item.uuid === typeUuid);
    const recurring = type?.isRecurring ?? false;

    const toggleMonth = (month: number) => setMonths(prev => (prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month].sort((a, b) => a - b)));

    const save = async () => {
        const amount = parseAmount(amountText);
        const lateFeeValue = lateFeeType === 'NONE' ? 0 : parseAmount(lateFeeText);
        const found: Record<string, string> = {};
        if (!yearUuid) found.academicYearUuid = 'Escolha o ano letivo';
        if (!typeUuid) found.feeTypeUuid = 'Escolha o tipo';
        if (!Number.isFinite(amount) || amount <= 0) found.amount = 'Indique um valor maior que 0';
        if (recurring && months.length === 0) found.months = 'Escolha pelo menos um mês';
        if (recurring && (!Number(dueDay) || Number(dueDay) < 1 || Number(dueDay) > 28)) found.dueDay = 'Dia entre 1 e 28';
        if (!recurring && !dueDate) found.dueDate = 'Indique a data de vencimento';
        if (lateFeeType !== 'NONE' && (!Number.isFinite(lateFeeValue) || lateFeeValue <= 0)) found.lateFeeValue = 'Indique o valor da multa';
        if (lateFeeType === 'PERCENT' && lateFeeValue > 100) found.lateFeeValue = 'Máximo 100%';
        setErrors(found);
        if (Object.keys(found).length) return;
        try {
            setSaving(true);
            const payload = {
                academicYearUuid: yearUuid,
                gradeUuid: gradeUuid || null,
                feeTypeUuid: typeUuid,
                amount,
                months: recurring ? months : [],
                dueDay: recurring ? Number(dueDay) : null,
                dueDate: recurring ? null : dueDate,
                lateFeeType,
                lateFeeValue,
                graceDays: Number(graceDays) || 0,
                isActive,
            };
            if (initial.uuid) await financeService.updateFeePlan(initial.uuid, payload);
            else await financeService.createFeePlan(payload);
            showSuccess(initial.uuid ? 'Preço atualizado' : 'Preço criado', `${type?.name ?? ''} · ${formatMoney(amount)}`);
            onSaved();
        } catch (err) {
            setErrors(getApiFieldErrors(err));
            showError('Não foi possível guardar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={initial.uuid ? 'Editar preço' : 'Novo preço'} size="lg">
            <div className={schedules.dialogBody}>
                <div className={schedules.formGrid}>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Ano letivo *</span>
                        <select className={schedules.nativeSelect} value={yearUuid} onChange={event => setYearUuid(event.target.value)}>
                            {years.map(year => (
                                <option key={year.uuid} value={year.uuid}>
                                    {year.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Classe</span>
                        <select className={schedules.nativeSelect} value={gradeUuid} onChange={event => setGradeUuid(event.target.value)}>
                            <option value="">Todas as classes</option>
                            {grades.map(grade => (
                                <option key={grade.uuid} value={grade.uuid}>
                                    {grade.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Tipo de cobrança *</span>
                        <select
                            className={schedules.nativeSelect}
                            value={typeUuid}
                            onChange={event => {
                                setTypeUuid(event.target.value);
                                const picked = types.find(item => item.uuid === event.target.value);
                                if (picked && !amountText && picked.defaultAmount) setAmountText(String(picked.defaultAmount).replace('.', ','));
                            }}
                        >
                            <option value="">Escolha…</option>
                            {types.map(item => (
                                <option key={item.uuid} value={item.uuid}>
                                    {item.name} ({item.isRecurring ? 'mensal' : 'pontual'})
                                </option>
                            ))}
                        </select>
                        {errors.feeTypeUuid && <span className={schedules.errorText}>{errors.feeTypeUuid}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Valor {recurring ? 'mensal ' : ''}(MT) *</span>
                        <input className={schedules.input} inputMode="decimal" value={amountText} onChange={event => setAmountText(event.target.value)} />
                        {errors.amount && <span className={schedules.errorText}>{errors.amount}</span>}
                    </label>

                    {recurring ? (
                        <>
                            <div className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                                <span className={schedules.fieldLabel}>Meses cobrados</span>
                                <div className={styles.nav} style={{ flexWrap: 'wrap' }}>
                                    {MONTHS.map((label, index) => (
                                        <button
                                            key={label}
                                            type="button"
                                            aria-pressed={months.includes(index + 1)}
                                            className={`${styles.navLink} ${months.includes(index + 1) ? styles.navActive : ''}`}
                                            onClick={() => toggleMonth(index + 1)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                {errors.months && <span className={schedules.errorText}>{errors.months}</span>}
                            </div>
                            <label className={schedules.field}>
                                <span className={schedules.fieldLabel}>Dia de vencimento</span>
                                <input className={schedules.input} type="number" min={1} max={28} value={dueDay} onChange={event => setDueDay(event.target.value)} />
                                {errors.dueDay && <span className={schedules.errorText}>{errors.dueDay}</span>}
                            </label>
                        </>
                    ) : (
                        <label className={schedules.field}>
                            <span className={schedules.fieldLabel}>Data de vencimento *</span>
                            <input className={schedules.input} type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} />
                            {errors.dueDate && <span className={schedules.errorText}>{errors.dueDate}</span>}
                        </label>
                    )}

                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Multa por atraso</span>
                        <select className={schedules.nativeSelect} value={lateFeeType} onChange={event => setLateFeeType(event.target.value as LateFeeType)}>
                            <option value="NONE">Sem multa</option>
                            <option value="PERCENT">Percentagem do valor</option>
                            <option value="FIXED">Valor fixo</option>
                        </select>
                    </label>
                    {lateFeeType !== 'NONE' && (
                        <>
                            <label className={schedules.field}>
                                <span className={schedules.fieldLabel}>{lateFeeType === 'PERCENT' ? 'Percentagem (%)' : 'Valor da multa (MT)'}</span>
                                <input className={schedules.input} inputMode="decimal" value={lateFeeText} onChange={event => setLateFeeTextValue(event.target.value)} />
                                {errors.lateFeeValue && <span className={schedules.errorText}>{errors.lateFeeValue}</span>}
                            </label>
                            <label className={schedules.field}>
                                <span className={schedules.fieldLabel}>Dias de tolerância</span>
                                <input className={schedules.input} type="number" min={0} max={90} value={graceDays} onChange={event => setGraceDays(event.target.value)} />
                            </label>
                        </>
                    )}
                    <label className={`${schedules.checkboxRow} ${schedules.fullRow}`}>
                        <input type="checkbox" checked={isActive} onChange={event => setIsActive(event.target.checked)} />
                        Ativo (usado ao gerar cobranças)
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
