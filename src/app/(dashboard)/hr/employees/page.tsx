// src/app/(dashboard)/hr/employees/page.tsx

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Edit, LogOut, Plus, RotateCcw, UserPlus, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { useToast } from '@/shared/contexts/ToastContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { usePermission } from '@/shared/hooks/usePermission';
import { DOCUMENT_TYPE_OPTIONS, documentTypeLabel } from '@/shared/constants/document-types';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { FinanceHeader } from '@/features/finance/components/FinanceUI';
import { formatMoney, todayIso } from '@/features/finance/utils/format';
import { Person } from '@/features/finance/components/FinancePageKit';
import { HrKpis, HrNav, LeaveStatusPill } from '@/features/hr/HrUI';
import {
    CONTRACT_STATUS_LABELS,
    CONTRACT_TYPE_LABELS,
    hrService,
    LEAVE_TYPE_LABELS,
    type Employee,
    type EmployeeDetail,
    type EmployeeInput,
} from '@/features/hr/hr.service';
import evaluation from '@/features/academic/assessments/styles/evaluation.module.css';
import { dashboardStyles as dash } from '@/features/dashboard-kit/DashboardKit';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import finance from '@/features/finance/components/finance.module.css';

const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Ativo', ON_LEAVE: 'De licença', TERMINATED: 'Saiu' };

export default function EmployeesPage() {
    const { hasPermission } = usePermission();
    const canManage = hasPermission('hr.manage');
    const { showSuccess, showError } = useToast();

    const [search, setSearch] = useState('');
    const debounced = useDebounce(search.trim(), 400);
    const [status, setStatus] = useState('ACTIVE');
    const [department, setDepartment] = useState('');
    const [kind, setKind] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [result, setResult] = useState<Awaited<ReturnType<typeof hrService.employees>> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Employee> | null>(null);
    const [detail, setDetail] = useState<EmployeeDetail | null>(null);
    const [syncing, setSyncing] = useState(false);

    const load = useCallback(async () => {
        try {
            setError(null);
            setResult(await hrService.employees({ page, limit, search: debounced, employmentStatus: status, department, teachers: kind }));
        } catch (err) {
            setError(getApiErrorMessage(err, 'Não foi possível carregar os funcionários.'));
        }
    }, [page, limit, debounced, status, department, kind]);

    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        setPage(1);
    }, [debounced, status, department, kind]);

    const openDetail = async (uuid: string) => {
        try {
            setDetail(await hrService.employee(uuid));
        } catch (err) {
            showError('Erro', getApiErrorMessage(err, 'Não foi possível abrir a ficha.'));
        }
    };

    const sync = async () => {
        try {
            setSyncing(true);
            const result = await hrService.syncTeachers();
            showSuccess('Professores importados', result.created ? `${result.created} ficha(s) criada(s).` : 'Todos os professores já tinham ficha.');
            load();
        } catch (err) {
            showError('Erro', getApiErrorMessage(err, 'Não foi possível importar.'));
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className={dash.root}>
            <FinanceHeader
                title="Funcionários"
                subtitle="Fichas do pessoal da escola, incluindo professores"
                icon={<Users size={24} />}
                actions={
                    canManage && (
                        <>
                            <Button variant="secondary" icon={<UserPlus size={16} />} onClick={sync} isLoading={syncing}>
                                Importar professores
                            </Button>
                            <Button icon={<Plus size={16} />} onClick={() => setForm({ gender: 'FEMALE', hireDate: todayIso(), annualLeaveDays: 22 })}>
                                Novo funcionário
                            </Button>
                        </>
                    )
                }
            />
            <HrNav />
            <HrKpis />

            <div className={finance.filterBar}>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Pesquisar</span>
                        <input className={schedules.input} value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome, nº, cargo ou email" />
                    </label>
                    <label className={schedules.field} style={{ maxWidth: 170 }}>
                        <span className={schedules.fieldLabel}>Estado</span>
                        <select className={schedules.nativeSelect} value={status} onChange={event => setStatus(event.target.value)}>
                            <option value="ACTIVE">Ativos</option>
                            <option value="TERMINATED">Saíram</option>
                            <option value="">Todos</option>
                        </select>
                    </label>
                    <label className={schedules.field} style={{ maxWidth: 220 }}>
                        <span className={schedules.fieldLabel}>Departamento</span>
                        <select className={schedules.nativeSelect} value={department} onChange={event => setDepartment(event.target.value)}>
                            <option value="">Todos</option>
                            {(result?.meta.departments ?? []).map(item => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={schedules.field} style={{ maxWidth: 190 }}>
                        <span className={schedules.fieldLabel}>Tipo</span>
                        <select className={schedules.nativeSelect} value={kind} onChange={event => setKind(event.target.value)}>
                            <option value="">Todos</option>
                            <option value="only">Professores</option>
                            <option value="exclude">Outro pessoal</option>
                        </select>
                    </label>
            </div>

            {error && <div className={`${evaluation.banner} ${evaluation.bannerWarning}`}>{error}</div>}

            <section className={finance.tableCard}>
                <div className={finance.tableHead}>
                    <h2 className={finance.tableTitle}>{result ? `${result.meta.total} funcionário(s)` : 'Funcionários'}</h2>
                </div>
                {!result ? (
                    <p className={finance.muted}>A carregar…</p>
                ) : result.data.length === 0 ? (
                    <p className={finance.muted}>Nenhum funcionário encontrado.</p>
                ) : (
                    <div className={finance.tableScroll}>
                        <table className={finance.dataTable}>
                            <thead>
                                <tr>
                                    <th>Funcionário</th>
                                    <th>Cargo</th>
                                    <th>Contrato</th>
                                    <th>Admissão</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.data.map(employee => (
                                    <tr key={employee.uuid} style={{ cursor: 'pointer' }} onClick={() => openDetail(employee.uuid)}>
                                        <td>
                                            <Person name={employee.fullName} sub={`${employee.employeeNumber}${employee.isTeacher ? ' · Professor(a)' : ''}`} />
                                        </td>
                                        <td>
                                            {employee.position}
                                            {employee.department && <div className={finance.muted}>{employee.department}</div>}
                                        </td>
                                        <td>
                                            {employee.activeContract ? (
                                                <>
                                                    {CONTRACT_TYPE_LABELS[employee.activeContract.contractType]}
                                                    {employee.activeContract.endDate && <div className={finance.muted}>até {formatDisplayDate(employee.activeContract.endDate)}</div>}
                                                </>
                                            ) : (
                                                <span className={finance.muted}>Sem contrato ativo</span>
                                            )}
                                        </td>
                                        <td>{formatDisplayDate(employee.hireDate)}</td>
                                        <td>
                                            {employee.employmentStatus === 'TERMINATED' ? (
                                                <span className={`${finance.pill} ${finance.pillCancelled}`}>Saiu</span>
                                            ) : employee.onLeaveToday ? (
                                                <span className={`${finance.pill} ${finance.pillPartial}`}>Ausente hoje</span>
                                            ) : (
                                                <span className={`${finance.pill} ${finance.pillPaid}`}>Ativo</span>
                                            )}
                                        </td>
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
                        itemLabel="funcionários"
                    />
                )}
            </section>

            {form && (
                <EmployeeDialog
                    initial={form}
                    onClose={() => setForm(null)}
                    onSaved={saved => {
                        setForm(null);
                        setDetail(saved);
                        load();
                    }}
                />
            )}
            {detail && !form && (
                <EmployeeDetailDialog
                    employee={detail}
                    canManage={canManage}
                    onClose={() => setDetail(null)}
                    onEdit={() => setForm(detail)}
                    onChanged={updated => {
                        setDetail(updated);
                        load();
                    }}
                />
            )}
        </div>
    );
}

const EmployeeDialog: React.FC<{ initial: Partial<Employee>; onClose: () => void; onSaved: (employee: EmployeeDetail) => void }> = ({ initial, onClose, onSaved }) => {
    const { showSuccess, showError } = useToast();
    const [values, setValues] = useState<Partial<Employee>>(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const set = <K extends keyof Employee>(key: K, value: Employee[K] | string) => setValues(prev => ({ ...prev, [key]: value }));
    const field = (key: keyof Employee, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
        <label className={schedules.field} style={{ maxWidth: 'none' }}>
            <span className={schedules.fieldLabel}>{label}</span>
            <input className={schedules.input} value={(values[key] as string | number | null | undefined) ?? ''} onChange={event => set(key, event.target.value)} {...props} />
            {errors[key] && <span className={schedules.errorText}>{errors[key]}</span>}
        </label>
    );

    const save = async () => {
        const found: Record<string, string> = {};
        if (!values.firstName || values.firstName.trim().length < 2) found.firstName = 'Indique o nome';
        if (!values.lastName || values.lastName.trim().length < 2) found.lastName = 'Indique o apelido';
        if (!values.position || values.position.trim().length < 2) found.position = 'Indique o cargo';
        if (!values.hireDate) found.hireDate = 'Indique a data de admissão';
        setErrors(found);
        if (Object.keys(found).length) return;
        try {
            setSaving(true);
            const payload = {
                firstName: values.firstName ?? '',
                middleName: values.middleName || null,
                lastName: values.lastName ?? '',
                gender: values.gender ?? 'FEMALE',
                birthDate: values.birthDate || null,
                documentType: values.documentType || null,
                documentNumber: values.documentNumber || null,
                taxNumber: values.taxNumber || null,
                phone: values.phone || null,
                email: values.email || null,
                address: values.address || null,
                position: values.position ?? '',
                department: values.department || null,
                hireDate: values.hireDate ?? '',
                annualLeaveDays: Number(values.annualLeaveDays ?? 22),
                bankName: values.bankName || null,
                bankAccount: values.bankAccount || null,
                emergencyContactName: values.emergencyContactName || null,
                emergencyContactPhone: values.emergencyContactPhone || null,
                notes: values.notes || null,
            } as EmployeeInput;
            const saved = initial.uuid ? await hrService.updateEmployee(initial.uuid, payload) : await hrService.createEmployee(payload);
            showSuccess(initial.uuid ? 'Ficha atualizada' : 'Funcionário criado', saved.fullName);
            onSaved(saved);
        } catch (err) {
            setErrors(getApiFieldErrors(err));
            showError('Não foi possível guardar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={initial.uuid ? `Editar · ${initial.fullName}` : 'Novo funcionário'} size="xl">
            <div className={schedules.dialogBody}>
                {initial.isTeacher && <div className={`${evaluation.banner} ${evaluation.bannerInfo}`}>Ficha de professor: o nome e os contactos são atualizados a partir da ficha do professor.</div>}
                <div className={schedules.formGrid}>
                    {field('firstName', 'Nome *')}
                    {field('lastName', 'Apelido *')}
                    {field('middleName', 'Nome do meio')}
                    <label className={schedules.field} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Género *</span>
                        <select className={schedules.nativeSelect} value={values.gender ?? 'FEMALE'} onChange={event => set('gender', event.target.value)}>
                            <option value="FEMALE">Feminino</option>
                            <option value="MALE">Masculino</option>
                        </select>
                    </label>
                    {field('birthDate', 'Data de nascimento', { type: 'date' })}
                    {field('taxNumber', 'NUIT')}
                    <label className={schedules.field} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Tipo de documento</span>
                        <select className={schedules.nativeSelect} value={values.documentType ?? ''} onChange={event => set('documentType', event.target.value)}>
                            {DOCUMENT_TYPE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    {field('documentNumber', 'Nº do documento')}
                    {field('phone', 'Telefone')}
                    {field('email', 'Email', { type: 'email' })}
                    <div className={schedules.fullRow}>{field('address', 'Endereço')}</div>
                    {field('position', 'Cargo *', { placeholder: 'Ex.: Secretária, Guarda, Contabilista' })}
                    {field('department', 'Departamento', { placeholder: 'Ex.: Secretaria, Docência' })}
                    {field('hireDate', 'Data de admissão *', { type: 'date' })}
                    {field('annualLeaveDays', 'Dias de férias por ano', { type: 'number', min: 0, max: 60 })}
                    {field('bankName', 'Banco')}
                    {field('bankAccount', 'Conta / NIB')}
                    {field('emergencyContactName', 'Contacto de emergência')}
                    {field('emergencyContactPhone', 'Telefone de emergência')}
                    <div className={schedules.fullRow}>{field('notes', 'Observações')}</div>
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

const EmployeeDetailDialog: React.FC<{
    employee: EmployeeDetail;
    canManage: boolean;
    onClose: () => void;
    onEdit: () => void;
    onChanged: (employee: EmployeeDetail) => void;
}> = ({ employee, canManage, onClose, onEdit, onChanged }) => {
    const { showSuccess, showError } = useToast();
    const [terminating, setTerminating] = useState(false);
    const [date, setDate] = useState(todayIso());
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    const run = async (action: () => Promise<EmployeeDetail>, message: string) => {
        try {
            setBusy(true);
            const updated = await action();
            showSuccess(message, updated.fullName);
            setTerminating(false);
            onChanged(updated);
        } catch (err) {
            showError('Erro', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setBusy(false);
        }
    };

    const info = (label: string, value: React.ReactNode) => (
        <div className={finance.listRow}>
            <span className={finance.muted}>{label}</span>
            <span style={{ textAlign: 'right' }}>{value || '—'}</span>
        </div>
    );

    return (
        <Modal isOpen onClose={onClose} title={employee.fullName} size="xl">
            <div className={schedules.dialogBody}>
                <div className={finance.studentHeader}>
                    <span className={finance.muted}>
                        {employee.employeeNumber} · {employee.position}
                        {employee.department ? ` · ${employee.department}` : ''}
                        {employee.isTeacher ? ' · Professor(a)' : ''}
                        {employee.username ? ` · utilizador ${employee.username}` : ''}
                    </span>
                    {canManage && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Button variant="secondary" icon={<Edit size={16} />} onClick={onEdit}>
                                Editar
                            </Button>
                            {employee.employmentStatus === 'TERMINATED' ? (
                                <Button variant="outline" icon={<RotateCcw size={16} />} onClick={() => run(() => hrService.reactivateEmployee(employee.uuid), 'Funcionário reativado')} isLoading={busy}>
                                    Reativar
                                </Button>
                            ) : (
                                <Button variant="outline" icon={<LogOut size={16} />} onClick={() => setTerminating(true)}>
                                    Registar saída
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {employee.employmentStatus === 'TERMINATED' && (
                    <div className={`${evaluation.banner} ${evaluation.bannerWarning}`}>
                        Saiu a {formatDisplayDate(employee.terminationDate)}: {employee.terminationReason}
                    </div>
                )}

                {terminating && (
                    <div className={finance.card}>
                        <div className={schedules.formGrid}>
                            <label className={schedules.field}>
                                <span className={schedules.fieldLabel}>Data de saída</span>
                                <input type="date" className={schedules.input} value={date} onChange={event => setDate(event.target.value)} />
                            </label>
                            <label className={schedules.field}>
                                <span className={schedules.fieldLabel}>Motivo *</span>
                                <input className={schedules.input} value={reason} maxLength={255} onChange={event => setReason(event.target.value)} placeholder="Ex.: fim de contrato, demissão" />
                            </label>
                        </div>
                        <p className={finance.muted}>O contrato ativo termina nesta data e os pedidos de ausência pendentes são cancelados.</p>
                        <div className={schedules.dialogActionsRight}>
                            <Button variant="secondary" onClick={() => setTerminating(false)}>
                                Voltar
                            </Button>
                            <Button variant="danger" disabled={reason.trim().length < 3} isLoading={busy} onClick={() => run(() => hrService.terminateEmployee(employee.uuid, date, reason.trim()), 'Saída registada')}>
                                Confirmar saída
                            </Button>
                        </div>
                    </div>
                )}

                <div className={finance.kpis}>
                    <div className={finance.kpi}>
                        <span className={finance.kpiLabel}>Férias {employee.vacation.year}</span>
                        <span className={finance.kpiValue}>{employee.vacation.available} dias</span>
                        <span className={finance.kpiHint}>
                            de {employee.vacation.entitlement} · gozados {employee.vacation.used}
                            {employee.vacation.pending ? ` · pendentes ${employee.vacation.pending}` : ''}
                        </span>
                    </div>
                    <div className={finance.kpi}>
                        <span className={finance.kpiLabel}>Contrato ativo</span>
                        <span className={finance.kpiValue} style={{ fontSize: 17 }}>
                            {employee.activeContract ? CONTRACT_TYPE_LABELS[employee.activeContract.contractType] : 'Nenhum'}
                        </span>
                        <span className={finance.kpiHint}>
                            {employee.activeContract ? `${formatMoney(employee.activeContract.baseSalary)}${employee.activeContract.endDate ? ` · até ${formatDisplayDate(employee.activeContract.endDate)}` : ''}` : 'Crie em Contratos'}
                        </span>
                    </div>
                </div>

                <div className={finance.grid2} style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className={finance.card}>
                        <span className={finance.cardTitle}>Dados pessoais</span>
                        {info('Género', employee.gender === 'MALE' ? 'Masculino' : 'Feminino')}
                        {info('Nascimento', formatDisplayDate(employee.birthDate))}
                        {info('Documento', employee.documentNumber ? `${documentTypeLabel(employee.documentType)} ${employee.documentNumber}` : null)}
                        {info('NUIT', employee.taxNumber)}
                        {info('Telefone', employee.phone)}
                        {info('Email', employee.email)}
                        {info('Endereço', employee.address)}
                    </div>
                    <div className={finance.card}>
                        <span className={finance.cardTitle}>Trabalho</span>
                        {info('Admissão', formatDisplayDate(employee.hireDate))}
                        {info('Banco', employee.bankName ? `${employee.bankName} · ${employee.bankAccount ?? ''}` : null)}
                        {info('Emergência', employee.emergencyContactName ? `${employee.emergencyContactName} · ${employee.emergencyContactPhone ?? ''}` : null)}
                        {info('Observações', employee.notes)}
                    </div>
                </div>

                <div className={finance.card}>
                    <span className={finance.cardTitle}>Contratos</span>
                    {employee.contracts.length === 0 ? (
                        <p className={finance.muted}>Sem contratos registados.</p>
                    ) : (
                        employee.contracts.map(contract => (
                            <div key={contract.uuid} className={finance.listRow}>
                                <span>
                                    <strong>{CONTRACT_TYPE_LABELS[contract.contractType]}</strong> · {contract.position}
                                    <br />
                                    <span className={finance.muted}>
                                        {formatDisplayDate(contract.startDate)} – {contract.endDate ? formatDisplayDate(contract.endDate) : 'sem termo'} · {formatMoney(contract.baseSalary)}
                                    </span>
                                </span>
                                <span className={`${finance.pill} ${contract.status === 'ACTIVE' ? finance.pillPaid : finance.pillCancelled}`}>{CONTRACT_STATUS_LABELS[contract.status]}</span>
                            </div>
                        ))
                    )}
                </div>

                <div className={finance.card}>
                    <span className={finance.cardTitle}>Ausências recentes</span>
                    {employee.recentLeaves.length === 0 ? (
                        <p className={finance.muted}>Sem pedidos de ausência.</p>
                    ) : (
                        employee.recentLeaves.map(leave => (
                            <div key={leave.uuid} className={finance.listRow}>
                                <span>
                                    {LEAVE_TYPE_LABELS[leave.leaveType]}
                                    <br />
                                    <span className={finance.muted}>
                                        {formatDisplayDate(leave.startDate)} – {formatDisplayDate(leave.endDate)} · {leave.days} dia(s) úteis
                                    </span>
                                </span>
                                <LeaveStatusPill status={leave.status} />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};
