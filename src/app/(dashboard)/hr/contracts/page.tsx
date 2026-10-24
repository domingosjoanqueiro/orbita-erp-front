// src/app/(dashboard)/hr/contracts/page.tsx

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Edit, FileSignature, Plus, StopCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { ActionButton, Person } from '@/features/finance/components/FinancePageKit';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { useToast } from '@/shared/contexts/ToastContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { FinanceHeader } from '@/features/finance/components/FinanceUI';
import { formatMoney, parseAmount, todayIso } from '@/features/finance/utils/format';
import { HrKpis, HrNav } from '@/features/hr/HrUI';
import { CONTRACT_STATUS_LABELS, CONTRACT_TYPE_LABELS, hrService, type Contract, type ContractType, type Employee } from '@/features/hr/hr.service';
import evaluation from '@/features/academic/assessments/styles/evaluation.module.css';
import { dashboardStyles as dash } from '@/features/dashboard-kit/DashboardKit';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import finance from '@/features/finance/components/finance.module.css';

export default function ContractsPage() {
    const { hasPermission } = usePermission();
    const canManage = hasPermission('hr.manage');
    const [search, setSearch] = useState('');
    const debounced = useDebounce(search.trim(), 400);
    const [status, setStatus] = useState('ACTIVE');
    const [expiring, setExpiring] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [result, setResult] = useState<Awaited<ReturnType<typeof hrService.contracts>> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Contract> | null>(null);
    const [ending, setEnding] = useState<Contract | null>(null);

    // ligação do painel de RH: /hr/contracts?expiring=true
    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('expiring') === 'true') setExpiring(true);
    }, []);

    const load = useCallback(async () => {
        try {
            setError(null);
            setResult(await hrService.contracts({ page, limit, search: debounced, contractStatus: expiring ? '' : status, expiring: expiring || undefined }));
        } catch (err) {
            setError(getApiErrorMessage(err, 'Não foi possível carregar os contratos.'));
        }
    }, [page, limit, debounced, status, expiring]);

    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        setPage(1);
    }, [debounced, status, expiring]);

    return (
        <div className={dash.root}>
            <FinanceHeader
                title="Contratos"
                subtitle="Contratos de trabalho e renovações"
                icon={<FileSignature size={24} />}
                actions={
                    canManage && (
                        <Button icon={<Plus size={16} />} onClick={() => setForm({ contractType: 'PERMANENT', startDate: todayIso() })}>
                            Novo contrato
                        </Button>
                    )
                }
            />
            <HrNav />
            <HrKpis />

            <div className={finance.filterBar}>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Pesquisar</span>
                        <input className={schedules.input} value={search} onChange={event => setSearch(event.target.value)} placeholder="Funcionário, nº ou cargo" />
                    </label>
                    <label className={schedules.field} style={{ maxWidth: 180 }}>
                        <span className={schedules.fieldLabel}>Estado</span>
                        <select className={schedules.nativeSelect} value={status} disabled={expiring} onChange={event => setStatus(event.target.value)}>
                            <option value="ACTIVE">Ativos</option>
                            <option value="ENDED">Terminados</option>
                            <option value="TERMINATED">Rescindidos</option>
                            <option value="">Todos</option>
                        </select>
                    </label>
                    <label className={schedules.checkboxRow} style={{ paddingBottom: 10 }}>
                        <input type="checkbox" checked={expiring} onChange={event => setExpiring(event.target.checked)} />
                        A terminar em 30 dias
                    </label>
            </div>

            {error && <div className={`${evaluation.banner} ${evaluation.bannerWarning}`}>{error}</div>}

            <section className={finance.tableCard}>
                <div className={finance.tableHead}>
                    <h2 className={finance.tableTitle}>{result ? `${result.meta.total} contrato(s)` : 'Contratos'}</h2>
                </div>
                {!result ? (
                    <p className={finance.muted}>A carregar…</p>
                ) : result.data.length === 0 ? (
                    <p className={finance.muted}>Nenhum contrato encontrado.</p>
                ) : (
                    <div className={finance.tableScroll}>
                        <table className={finance.dataTable}>
                            <thead>
                                <tr>
                                    <th>Funcionário</th>
                                    <th>Tipo</th>
                                    <th>Período</th>
                                    <th className={finance.right}>Salário base</th>
                                    <th>Estado</th>
                                    {canManage && <th className={finance.right}>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {result.data.map(contract => (
                                    <tr key={contract.uuid}>
                                        <td>
                                            <Person name={contract.employee?.name ?? ''} sub={`${contract.employee?.number} · ${contract.position}`} />
                                        </td>
                                        <td>{CONTRACT_TYPE_LABELS[contract.contractType]}</td>
                                        <td>
                                            {formatDisplayDate(contract.startDate)} – {contract.endDate ? formatDisplayDate(contract.endDate) : 'sem termo'}
                                            {contract.expiringSoon && (
                                                <div className={finance.danger} style={{ fontSize: 12.5, fontWeight: 600 }}>
                                                    {contract.daysLeft !== null && contract.daysLeft !== undefined && contract.daysLeft < 0 ? 'Prazo já passou' : `Termina em ${contract.daysLeft} dia(s)`}
                                                </div>
                                            )}
                                        </td>
                                        <td className={`${finance.right} ${finance.amountStrong}`}>
                                            {formatMoney(contract.baseSalary)}
                                            {contract.weeklyHours ? <div className={finance.muted}>{contract.weeklyHours} h/semana</div> : null}
                                        </td>
                                        <td>
                                            <span className={`${finance.pill} ${contract.status === 'ACTIVE' ? finance.pillPaid : finance.pillCancelled}`}>{CONTRACT_STATUS_LABELS[contract.status]}</span>
                                        </td>
                                        {canManage && (
                                            <td>
                                                {contract.status === 'ACTIVE' && (
                                                    <div className={finance.rowActionsRight}>
                                                        <ActionButton tone="blue" icon={<Edit size={14} />} onClick={() => setForm(contract)}>
                                                            Editar
                                                        </ActionButton>
                                                        <ActionButton tone="red" icon={<StopCircle size={14} />} onClick={() => setEnding(contract)}>
                                                            Terminar
                                                        </ActionButton>
                                                    </div>
                                                )}
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
                        itemLabel="contratos"
                    />
                )}
            </section>

            {form && <ContractDialog initial={form} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
            {ending && <EndContractDialog contract={ending} onClose={() => setEnding(null)} onDone={() => { setEnding(null); load(); }} />}
        </div>
    );
}

const ContractDialog: React.FC<{ initial: Partial<Contract>; onClose: () => void; onSaved: () => void }> = ({ initial, onClose, onSaved }) => {
    const { showSuccess, showError } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [employeeUuid, setEmployeeUuid] = useState(initial.employee?.uuid ?? '');
    const [contractType, setContractType] = useState<ContractType>(initial.contractType ?? 'PERMANENT');
    const [startDate, setStartDate] = useState(initial.startDate ?? todayIso());
    const [endDate, setEndDate] = useState(initial.endDate ?? '');
    const [position, setPosition] = useState(initial.position ?? '');
    const [salary, setSalary] = useState(initial.baseSalary !== undefined ? String(initial.baseSalary).replace('.', ',') : '');
    const [hours, setHours] = useState(initial.weeklyHours ? String(initial.weeklyHours) : '');
    const [notes, setNotes] = useState(initial.notes ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initial.uuid) return;
        hrService.employees({ employmentStatus: 'ACTIVE', limit: 100 }).then(result => setEmployees(result.data)).catch(() => setEmployees([]));
    }, [initial.uuid]);

    const save = async () => {
        const baseSalary = salary.trim() ? parseAmount(salary) : 0;
        const found: Record<string, string> = {};
        if (!initial.uuid && !employeeUuid) found.employeeUuid = 'Escolha o funcionário';
        if (position.trim().length < 2) found.position = 'Indique o cargo';
        if (!Number.isFinite(baseSalary) || baseSalary < 0) found.baseSalary = 'Salário inválido';
        if (contractType === 'FIXED_TERM' && !endDate) found.endDate = 'Um contrato a prazo precisa de fim';
        if (endDate && endDate < startDate) found.endDate = 'Não pode ser antes do início';
        setErrors(found);
        if (Object.keys(found).length) return;
        try {
            setSaving(true);
            const payload = {
                contractType,
                startDate,
                endDate: endDate || null,
                position: position.trim(),
                baseSalary,
                weeklyHours: hours ? Number(hours) : null,
                notes: notes.trim() || null,
            };
            if (initial.uuid) await hrService.updateContract(initial.uuid, payload);
            else await hrService.createContract({ ...payload, employeeUuid });
            showSuccess(initial.uuid ? 'Contrato atualizado' : 'Contrato criado', position);
            onSaved();
        } catch (err) {
            setErrors(getApiFieldErrors(err));
            showError('Não foi possível guardar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={initial.uuid ? `Editar contrato · ${initial.employee?.name}` : 'Novo contrato'} size="lg">
            <div className={schedules.dialogBody}>
                <div className={schedules.formGrid}>
                    {!initial.uuid && (
                        <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                            <span className={schedules.fieldLabel}>Funcionário *</span>
                            <select
                                className={schedules.nativeSelect}
                                value={employeeUuid}
                                onChange={event => {
                                    setEmployeeUuid(event.target.value);
                                    const picked = employees.find(item => item.uuid === event.target.value);
                                    if (picked && !position) setPosition(picked.position);
                                }}
                            >
                                <option value="">Escolha…</option>
                                {employees.map(item => (
                                    <option key={item.uuid} value={item.uuid} disabled={!!item.activeContract}>
                                        {item.fullName} ({item.employeeNumber}){item.activeContract ? ' — já tem contrato ativo' : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.employeeUuid && <span className={schedules.errorText}>{errors.employeeUuid}</span>}
                        </label>
                    )}
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Tipo *</span>
                        <select className={schedules.nativeSelect} value={contractType} onChange={event => setContractType(event.target.value as ContractType)}>
                            {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Cargo *</span>
                        <input className={schedules.input} value={position} maxLength={100} onChange={event => setPosition(event.target.value)} />
                        {errors.position && <span className={schedules.errorText}>{errors.position}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Início *</span>
                        <input type="date" className={schedules.input} value={startDate} onChange={event => setStartDate(event.target.value)} />
                        {errors.startDate && <span className={schedules.errorText}>{errors.startDate}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Fim {contractType === 'FIXED_TERM' ? '*' : '(opcional)'}</span>
                        <input type="date" className={schedules.input} value={endDate} min={startDate} onChange={event => setEndDate(event.target.value)} />
                        {errors.endDate && <span className={schedules.errorText}>{errors.endDate}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Salário base (MT)</span>
                        <input className={schedules.input} inputMode="decimal" value={salary} onChange={event => setSalary(event.target.value)} />
                        {errors.baseSalary && <span className={schedules.errorText}>{errors.baseSalary}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Horas por semana</span>
                        <input className={schedules.input} type="number" min={1} max={80} value={hours} onChange={event => setHours(event.target.value)} />
                    </label>
                    <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Observações</span>
                        <input className={schedules.input} value={notes} onChange={event => setNotes(event.target.value)} />
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

const EndContractDialog: React.FC<{ contract: Contract; onClose: () => void; onDone: () => void }> = ({ contract, onClose, onDone }) => {
    const { showSuccess, showError } = useToast();
    const [endDate, setEndDate] = useState(contract.endDate && contract.endDate < todayIso() ? contract.endDate : todayIso());
    const [terminated, setTerminated] = useState(false);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const save = async () => {
        try {
            setSaving(true);
            await hrService.endContract(contract.uuid, endDate, terminated, reason.trim() || null);
            showSuccess(terminated ? 'Contrato rescindido' : 'Contrato terminado', contract.employee?.name ?? '');
            onDone();
        } catch (err) {
            showError('Não foi possível terminar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };
    return (
        <Modal isOpen onClose={onClose} title={`Terminar contrato · ${contract.employee?.name}`} size="md">
            <div className={schedules.dialogBody}>
                <p className={finance.muted}>Depois de terminar pode criar um novo contrato (renovação) para o mesmo funcionário.</p>
                <label className={schedules.field} style={{ maxWidth: 'none' }}>
                    <span className={schedules.fieldLabel}>Data de fim</span>
                    <input type="date" className={schedules.input} value={endDate} min={contract.startDate} onChange={event => setEndDate(event.target.value)} />
                </label>
                <label className={schedules.checkboxRow}>
                    <input type="checkbox" checked={terminated} onChange={event => setTerminated(event.target.checked)} />
                    Rescisão antecipada
                </label>
                <label className={schedules.field} style={{ maxWidth: 'none' }}>
                    <span className={schedules.fieldLabel}>Motivo {terminated ? '*' : ''}</span>
                    <input className={schedules.input} value={reason} maxLength={255} onChange={event => setReason(event.target.value)} />
                </label>
                <div className={schedules.dialogActions}>
                    <div className={schedules.dialogActionsRight}>
                        <Button variant="secondary" onClick={onClose} disabled={saving}>
                            Voltar
                        </Button>
                        <Button variant="danger" onClick={save} isLoading={saving} disabled={terminated && reason.trim().length < 3}>
                            Terminar contrato
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
