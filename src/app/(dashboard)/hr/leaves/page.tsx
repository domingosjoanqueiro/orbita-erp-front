// src/app/(dashboard)/hr/leaves/page.tsx

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Ban, CalendarOff, Check, Plus, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { ActionButton, Person } from '@/features/finance/components/FinancePageKit';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { useToast } from '@/shared/contexts/ToastContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { FinanceHeader } from '@/features/finance/components/FinanceUI';
import { todayIso } from '@/features/finance/utils/format';
import { HrKpis, HrNav, LeaveStatusPill } from '@/features/hr/HrUI';
import { LeaveRequestDialog } from '@/features/hr/LeaveRequestDialog';
import { hrService, LEAVE_TYPE_LABELS, type LeaveRequest } from '@/features/hr/hr.service';
import evaluation from '@/features/academic/assessments/styles/evaluation.module.css';
import { dashboardStyles as dash } from '@/features/dashboard-kit/DashboardKit';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import finance from '@/features/finance/components/finance.module.css';

export default function LeavesPage() {
    const { hasPermission } = usePermission();
    const canManage = hasPermission('hr.manage');
    const { showSuccess, showError } = useToast();
    const [search, setSearch] = useState('');
    const debounced = useDebounce(search.trim(), 400);
    const [status, setStatus] = useState('PENDING');
    const [type, setType] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [result, setResult] = useState<Awaited<ReturnType<typeof hrService.leaves>> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [deciding, setDeciding] = useState<{ leave: LeaveRequest; approve: boolean } | null>(null);

    const load = useCallback(async () => {
        try {
            setError(null);
            setResult(await hrService.leaves({ page, limit, search: debounced, leaveStatus: status, type }));
        } catch (err) {
            setError(getApiErrorMessage(err, 'Não foi possível carregar os pedidos.'));
        }
    }, [page, limit, debounced, status, type]);

    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        setPage(1);
    }, [debounced, status, type]);

    const cancel = async (leave: LeaveRequest) => {
        try {
            await hrService.cancelLeave(leave.uuid);
            showSuccess('Pedido cancelado', leave.employee.name);
            load();
        } catch (err) {
            showError('Não foi possível cancelar', getApiErrorMessage(err, 'Tente novamente.'));
        }
    };

    return (
        <div className={dash.root}>
            <FinanceHeader
                title="Férias e ausências"
                subtitle={result?.meta.pending ? `${result.meta.pending} pedido(s) a aguardar decisão` : 'Pedidos de férias, licenças e faltas justificadas'}
                icon={<CalendarOff size={24} />}
                actions={
                    canManage && (
                        <Button icon={<Plus size={16} />} onClick={() => setCreating(true)}>
                            Registar ausência
                        </Button>
                    )
                }
            />
            <HrNav />
            <HrKpis />

            <div className={finance.filterBar}>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Pesquisar</span>
                        <input className={schedules.input} value={search} onChange={event => setSearch(event.target.value)} placeholder="Funcionário ou nº" />
                    </label>
                    <label className={schedules.field} style={{ maxWidth: 180 }}>
                        <span className={schedules.fieldLabel}>Estado</span>
                        <select className={schedules.nativeSelect} value={status} onChange={event => setStatus(event.target.value)}>
                            <option value="PENDING">Pendentes</option>
                            <option value="APPROVED">Aprovados</option>
                            <option value="REJECTED">Recusados</option>
                            <option value="CANCELLED">Cancelados</option>
                            <option value="">Todos</option>
                        </select>
                    </label>
                    <label className={schedules.field} style={{ maxWidth: 220 }}>
                        <span className={schedules.fieldLabel}>Tipo</span>
                        <select className={schedules.nativeSelect} value={type} onChange={event => setType(event.target.value)}>
                            <option value="">Todos</option>
                            {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
            </div>

            {error && <div className={`${evaluation.banner} ${evaluation.bannerWarning}`}>{error}</div>}

            <section className={finance.tableCard}>
                <div className={finance.tableHead}>
                    <h2 className={finance.tableTitle}>{result ? `${result.meta.total} pedido(s)` : 'Pedidos'}</h2>
                </div>
                {!result ? (
                    <p className={finance.muted}>A carregar…</p>
                ) : result.data.length === 0 ? (
                    <p className={finance.muted}>Nenhum pedido com estes filtros.</p>
                ) : (
                    <div className={finance.tableScroll}>
                        <table className={finance.dataTable}>
                            <thead>
                                <tr>
                                    <th>Funcionário</th>
                                    <th>Tipo</th>
                                    <th>Período</th>
                                    <th>Dias úteis</th>
                                    <th>Estado</th>
                                    {canManage && <th className={finance.right}>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {result.data.map(leave => (
                                    <tr key={leave.uuid}>
                                        <td>
                                            <Person name={leave.employee.name} sub={`${leave.employee.number} · ${leave.employee.position}`} />
                                        </td>
                                        <td>
                                            {leave.leaveTypeLabel}
                                            {leave.reason && <div className={finance.muted}>{leave.reason}</div>}
                                        </td>
                                        <td>
                                            {formatDisplayDate(leave.startDate)} – {formatDisplayDate(leave.endDate)}
                                        </td>
                                        <td>{leave.days}</td>
                                        <td>
                                            <LeaveStatusPill status={leave.status} />
                                            {leave.decidedBy && (
                                                <div className={finance.muted}>
                                                    por {leave.decidedBy}
                                                    {leave.decisionNotes ? ` · ${leave.decisionNotes}` : ''}
                                                </div>
                                            )}
                                        </td>
                                        {canManage && (
                                            <td>
                                                <div className={finance.rowActionsRight}>
                                                    {leave.status === 'PENDING' && (
                                                        <>
                                                            <ActionButton tone="green" icon={<Check size={14} />} onClick={() => setDeciding({ leave, approve: true })}>
                                                                Aprovar
                                                            </ActionButton>
                                                            <ActionButton tone="red" icon={<X size={14} />} onClick={() => setDeciding({ leave, approve: false })}>
                                                                Recusar
                                                            </ActionButton>
                                                        </>
                                                    )}
                                                    {(leave.status === 'PENDING' || (leave.status === 'APPROVED' && leave.startDate > todayIso())) && (
                                                        <ActionButton tone="red" icon={<Ban size={14} />} onClick={() => cancel(leave)} aria-label="Cancelar pedido" />
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {result && result.meta.total > 0 && (
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
                        itemLabel="pedidos"
                    />
                )}
            </section>

            {creating && <LeaveRequestDialog onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load(); }} />}
            {deciding && <DecisionDialog {...deciding} onClose={() => setDeciding(null)} onDone={() => { setDeciding(null); load(); }} />}
        </div>
    );
}

const DecisionDialog: React.FC<{ leave: LeaveRequest; approve: boolean; onClose: () => void; onDone: () => void }> = ({ leave, approve, onClose, onDone }) => {
    const { showSuccess, showError } = useToast();
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const save = async () => {
        try {
            setSaving(true);
            await hrService.decideLeave(leave.uuid, approve, notes.trim() || null);
            showSuccess(approve ? 'Pedido aprovado' : 'Pedido recusado', leave.employee.name);
            onDone();
        } catch (err) {
            showError('Não foi possível decidir', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };
    return (
        <Modal isOpen onClose={onClose} title={approve ? 'Aprovar pedido' : 'Recusar pedido'} size="md">
            <div className={schedules.dialogBody}>
                <p className={finance.muted}>
                    {leave.employee.name} · {leave.leaveTypeLabel} · {formatDisplayDate(leave.startDate)} – {formatDisplayDate(leave.endDate)} ({leave.days} dia(s) úteis)
                </p>
                <label className={schedules.field} style={{ maxWidth: 'none' }}>
                    <span className={schedules.fieldLabel}>{approve ? 'Observação (opcional)' : 'Motivo da recusa *'}</span>
                    <input className={schedules.input} value={notes} maxLength={500} onChange={event => setNotes(event.target.value)} />
                </label>
                <div className={schedules.dialogActions}>
                    <div className={schedules.dialogActionsRight}>
                        <Button variant="secondary" onClick={onClose} disabled={saving}>
                            Voltar
                        </Button>
                        <Button variant={approve ? 'success' : 'danger'} onClick={save} isLoading={saving} disabled={!approve && notes.trim().length < 3}>
                            {approve ? 'Aprovar' : 'Recusar'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
