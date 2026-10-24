// src/app/(dashboard)/finance/charges/page.tsx

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CalendarPlus, ListChecks, Receipt, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { useToast } from '@/shared/contexts/ToastContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { financeService } from '@/features/finance/services/finance.service';
import { ChargeStatusPill } from '@/features/finance/components/FinanceUI';
import { EmptyBox, FilterBar, FinancePage, LoadingRows, Person, TableCard } from '@/features/finance/components/FinancePageKit';
import { useFinanceLookups } from '@/features/finance/hooks/useFinanceLookups';
import type { Charge, ListResult } from '@/features/finance/types/finance.types';
import { formatMoney, todayIso } from '@/features/finance/utils/format';
import { dashboardStyles as dash, KpiTile } from '@/features/dashboard-kit/DashboardKit';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import styles from '@/features/finance/components/finance.module.css';

const DEFAULTS = { search: '', status: 'OPEN', overdue: false, yearUuid: '', classUuid: '', month: '' };

export default function ChargesPage() {
    const { hasPermission } = usePermission();
    const canManage = hasPermission('finance.manage');
    const { years, grades, classes } = useFinanceLookups();

    const [filters, setFilters] = useState(DEFAULTS);
    const debounced = useDebounce(filters.search.trim(), 400);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [result, setResult] = useState<ListResult<Charge> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);

    const set = (changes: Partial<typeof DEFAULTS>) => setFilters(prev => ({ ...prev, ...changes }));
    const dirty = JSON.stringify(filters) !== JSON.stringify(DEFAULTS);

    const load = useCallback(async () => {
        try {
            setError(null);
            setResult(
                await financeService.charges({
                    page,
                    limit,
                    search: debounced,
                    chargeStatus: filters.status,
                    overdue: filters.overdue || undefined,
                    academicYearUuid: filters.yearUuid,
                    classUuid: filters.classUuid,
                    month: filters.month,
                })
            );
        } catch (err) {
            setError(getApiErrorMessage(err, 'Não foi possível carregar as cobranças.'));
        }
    }, [page, limit, debounced, filters.status, filters.overdue, filters.yearUuid, filters.classUuid, filters.month]);

    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        setPage(1);
    }, [debounced, filters.status, filters.overdue, filters.yearUuid, filters.classUuid, filters.month]);

    const totals = result?.meta.totals;

    return (
        <FinancePage
            title="Cobranças"
            subtitle="Propinas e outros valores devidos pelos alunos"
            icon={<ListChecks size={24} />}
            actions={
                canManage && (
                    <Button icon={<CalendarPlus size={16} />} onClick={() => setGenerating(true)}>
                        Gerar cobranças
                    </Button>
                )
            }
        >
            <div className={dash.kpis}>
                <KpiTile tone="blue" label="Em dívida" icon={<Receipt size={18} />} value={totals ? formatMoney(totals.due) : '…'} foot={<span>Por receber nos filtros atuais</span>} />
                <KpiTile
                    tone="red" label="Em atraso"
                    icon={<AlertTriangle size={18} />}
                    value={totals ? formatMoney(totals.overdue) : '…'}
                    alert={!!totals?.overdue}
                    foot={<span>{totals?.overdueCount ?? 0} cobrança(s) vencida(s)</span>}
                />
                <KpiTile tone="purple" label="Alunos" icon={<Users size={18} />} value={totals ? String(totals.students) : '…'} foot={<span>{result?.meta.total ?? 0} cobrança(s) · {formatMoney(totals?.net ?? 0)} faturado</span>} />
            </div>

            <FilterBar onClear={() => setFilters(DEFAULTS)} active={dirty}>
                <label className={`${schedules.field} ${styles.filterSearch}`}>
                    <span className={schedules.fieldLabel}>Pesquisar</span>
                    <input className={schedules.input} value={filters.search} onChange={e => set({ search: e.target.value })} placeholder="Aluno, nº ou descrição" />
                </label>
                <label className={schedules.field}>
                    <span className={schedules.fieldLabel}>Estado</span>
                    <select className={schedules.nativeSelect} value={filters.status} onChange={e => set({ status: e.target.value })}>
                        <option value="OPEN">Em aberto</option>
                        <option value="PENDING">Por pagar</option>
                        <option value="PARTIAL">Pago em parte</option>
                        <option value="PAID">Pagas</option>
                        <option value="CANCELLED">Anuladas</option>
                        <option value="">Todas</option>
                    </select>
                </label>
                <label className={schedules.field}>
                    <span className={schedules.fieldLabel}>Ano letivo</span>
                    <select className={schedules.nativeSelect} value={filters.yearUuid} onChange={e => set({ yearUuid: e.target.value })}>
                        <option value="">Todos</option>
                        {years.map(year => (
                            <option key={year.uuid} value={year.uuid}>
                                {year.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className={schedules.field}>
                    <span className={schedules.fieldLabel}>Turma</span>
                    <select className={schedules.nativeSelect} value={filters.classUuid} onChange={e => set({ classUuid: e.target.value })}>
                        <option value="">Todas</option>
                        {classes.map(item => (
                            <option key={item.uuid} value={item.uuid}>
                                {item.name} ({item.year})
                            </option>
                        ))}
                    </select>
                </label>
                <label className={schedules.field}>
                    <span className={schedules.fieldLabel}>Mês de referência</span>
                    <input type="month" className={schedules.input} value={filters.month} onChange={e => set({ month: e.target.value })} />
                </label>
                <label className={schedules.checkboxRow} style={{ paddingBottom: 10, flex: '0 0 auto' }}>
                    <input type="checkbox" checked={filters.overdue} onChange={e => set({ overdue: e.target.checked })} />
                    Só em atraso
                </label>
            </FilterBar>

            {error && <div className={styles.card} role="alert">{error}</div>}

            <TableCard
                title="Cobranças"
                hint={result ? `${result.meta.total} resultado(s)` : undefined}
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
                            itemLabel="cobranças"
                        />
                    ) : undefined
                }
            >
                {!result ? (
                    <LoadingRows />
                ) : result.data.length === 0 ? (
                    <EmptyBox
                        icon={<ListChecks size={24} />}
                        title={dirty ? 'Nenhuma cobrança com estes filtros' : 'Ainda não há cobranças'}
                        text={dirty ? 'Experimente outros filtros.' : 'Gere as cobranças a partir da tabela de propinas para as matrículas ativas.'}
                        action={
                            dirty ? (
                                <Button variant="secondary" onClick={() => setFilters(DEFAULTS)}>
                                    Limpar filtros
                                </Button>
                            ) : (
                                canManage && (
                                    <Button icon={<CalendarPlus size={16} />} onClick={() => setGenerating(true)}>
                                        Gerar cobranças
                                    </Button>
                                )
                            )
                        }
                    />
                ) : (
                    <table className={styles.dataTable}>
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Descrição</th>
                                <th>Vencimento</th>
                                <th className={styles.right}>Valor</th>
                                <th className={styles.right}>Em dívida</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.map(charge => {
                                const open = charge.status === 'PENDING' || charge.status === 'PARTIAL';
                                return (
                                    <tr key={charge.uuid} className={charge.status === 'CANCELLED' ? styles.rowMuted : undefined}>
                                        <td>
                                            <Person
                                                name={charge.student.name}
                                                sub={`Nº ${charge.student.number}${charge.class ? ` · ${charge.class.gradeName} ${charge.class.name}` : ''}`}
                                                href={`/finance/cashier?student=${charge.student.uuid}`}
                                            />
                                        </td>
                                        <td>
                                            {charge.description}
                                            {charge.discount > 0 && <span className={styles.cellSub}>Desconto {formatMoney(charge.discount)}</span>}
                                        </td>
                                        <td>
                                            {formatDisplayDate(charge.dueDate)}
                                            {charge.isOverdue && <span className={styles.cellSub}>há {charge.daysOverdue} dia(s)</span>}
                                        </td>
                                        <td className={styles.right}>{formatMoney(charge.net)}</td>
                                        <td className={`${styles.right} ${styles.amountStrong} ${charge.isOverdue ? styles.danger : ''}`}>
                                            {open ? formatMoney(charge.totalDue) : '—'}
                                            {charge.fineDue > 0 && <span className={styles.cellSub}>inclui multa {formatMoney(charge.fineDue)}</span>}
                                        </td>
                                        <td>
                                            <ChargeStatusPill charge={charge} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </TableCard>

            {generating && (
                <GenerateDialog
                    years={years}
                    grades={grades}
                    onClose={() => setGenerating(false)}
                    onDone={() => {
                        setGenerating(false);
                        load();
                    }}
                />
            )}
        </FinancePage>
    );
}

const GenerateDialog: React.FC<{
    years: { uuid: string; name: string }[];
    grades: { uuid: string; name: string }[];
    onClose: () => void;
    onDone: () => void;
}> = ({ years, grades, onClose, onDone }) => {
    const { showSuccess, showError } = useToast();
    const [yearUuid, setYearUuid] = useState(years[0]?.uuid ?? '');
    const [gradeUuid, setGradeUuid] = useState('');
    const [untilMonth, setUntilMonth] = useState(todayIso().slice(0, 7));
    const [saving, setSaving] = useState(false);

    // os anos podem chegar depois de o diálogo abrir
    useEffect(() => {
        if (!yearUuid && years[0]) setYearUuid(years[0].uuid);
    }, [years, yearUuid]);

    const run = async () => {
        try {
            setSaving(true);
            const result = await financeService.generateCharges({ academicYearUuid: yearUuid, gradeUuid: gradeUuid || null, untilMonth: untilMonth || null });
            showSuccess(
                'Cobranças geradas',
                result.created ? `${result.created} cobrança(s) para ${result.students} aluno(s) · ${formatMoney(result.totalAmount)}` : 'Não havia cobranças novas a gerar.'
            );
            onDone();
        } catch (err) {
            showError('Não foi possível gerar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Gerar cobranças" size="md">
            <div className={schedules.dialogBody}>
                <p className={styles.muted}>
                    Aplica a tabela de propinas às matrículas ativas. Pode repetir sempre que houver novas matrículas: o que já foi cobrado não é duplicado, e os meses anteriores à matrícula não são cobrados.
                </p>
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
                            <option value="">Todas</option>
                            {grades.map(grade => (
                                <option key={grade.uuid} value={grade.uuid}>
                                    {grade.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Mensalidades até ao mês</span>
                        <input type="month" className={schedules.input} value={untilMonth} onChange={event => setUntilMonth(event.target.value)} />
                        <span className={styles.muted}>Deixe vazio para gerar já todos os meses do ano letivo.</span>
                    </label>
                </div>
                <div className={schedules.dialogActions}>
                    <div className={schedules.dialogActionsRight}>
                        <Button variant="secondary" onClick={onClose} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={run} isLoading={saving} disabled={!yearUuid}>
                            Gerar
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
