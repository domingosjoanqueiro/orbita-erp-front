// src/app/(dashboard)/finance/cashier/page.tsx

'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, BadgePercent, Ban, CalendarClock, CalendarPlus, CheckCircle2, FilePlus2, ListChecks, Printer, Receipt, Wallet, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { useToast } from '@/shared/contexts/ToastContext';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { financeService } from '@/features/finance/services/finance.service';
import { ChargeStatusPill, StudentPicker } from '@/features/finance/components/FinanceUI';
import { EmptyBox, FinancePage, LoadingRows, TableCard, ActionButton } from '@/features/finance/components/FinancePageKit';
import { Card as DashCard, dashboardStyles as dash, initials, KpiTile, ListItem } from '@/features/dashboard-kit/DashboardKit';
import { PaymentDialog } from '@/features/finance/components/PaymentDialog';
import type { Charge, Debtor, FeeType, Payment, StudentAccount } from '@/features/finance/types/finance.types';
import { formatMoney, parseAmount, todayIso } from '@/features/finance/utils/format';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import styles from '@/features/finance/components/finance.module.css';

type Dialog =
    | { type: 'pay' }
    | { type: 'discount'; charge: Charge }
    | { type: 'cancel'; charge: Charge }
    | { type: 'charge' }
    | null;

function CashierContent() {
    const router = useRouter();
    const params = useSearchParams();
    const studentUuid = params.get('student') ?? '';
    const { showSuccess, showError } = useToast();
    const { hasPermission } = usePermission();
    const canPay = hasPermission('finance.payments');
    const canManage = hasPermission('finance.manage');

    const [account, setAccount] = useState<StudentAccount | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [dialog, setDialog] = useState<Dialog>(null);
    const [busy, setBusy] = useState(false);
    const [lastReceipt, setLastReceipt] = useState<{ uuid: string; number: string } | null>(null);
    const [showCancelled, setShowCancelled] = useState(false);
    const [shortcuts, setShortcuts] = useState<{ debtors: Debtor[]; payments: Payment[] } | null>(null);

    const load = useCallback(async () => {
        if (!studentUuid) {
            setAccount(null);
            return;
        }
        try {
            setError(null);
            const result = await financeService.studentAccount(studentUuid);
            setAccount(result);
            // por omissão escolhe todas as cobranças vencidas (ou a próxima)
            const open = result.charges.filter(charge => charge.status === 'PENDING' || charge.status === 'PARTIAL');
            const overdue = open.filter(charge => charge.isOverdue);
            setSelected(new Set((overdue.length ? overdue : open.slice(0, 1)).map(charge => charge.uuid)));
        } catch (err) {
            setAccount(null);
            setError(getApiErrorMessage(err, 'Não foi possível carregar a conta do aluno.'));
        }
    }, [studentUuid]);

    useEffect(() => {
        load();
        setLastReceipt(null);
    }, [load]);

    // atalhos quando ainda não há aluno escolhido
    useEffect(() => {
        if (studentUuid || shortcuts) return;
        Promise.all([financeService.debtors({ page: 1, limit: 6 }), financeService.payments({ page: 1, limit: 6, paymentStatus: 'VALID' })])
            .then(([debtors, payments]) => setShortcuts({ debtors: debtors.data, payments: payments.data }))
            .catch(() => setShortcuts({ debtors: [], payments: [] }));
    }, [studentUuid, shortcuts]);

    const open = useMemo(() => (account?.charges ?? []).filter(charge => charge.status === 'PENDING' || charge.status === 'PARTIAL'), [account]);
    const visibleCharges = (account?.charges ?? []).filter(charge => showCancelled || charge.status !== 'CANCELLED');
    const selectedCharges = open.filter(charge => selected.has(charge.uuid));
    const selectedTotal = selectedCharges.reduce((sum, charge) => sum + charge.totalDue, 0);
    const allSelected = open.length > 0 && selectedCharges.length === open.length;

    const toggle = (uuid: string) =>
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid);
            else next.add(uuid);
            return next;
        });

    const generate = async () => {
        if (!account?.enrollment) return;
        try {
            setBusy(true);
            const result = await financeService.generateCharges({ academicYearUuid: account.enrollment.academicYearUuid, studentUuid: account.student.uuid });
            showSuccess('Cobranças geradas', result.created ? `${result.created} nova(s) cobrança(s) · ${formatMoney(result.totalAmount)}` : 'Já estavam todas emitidas.');
            await load();
        } catch (err) {
            showError('Não foi possível gerar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setBusy(false);
        }
    };

    const pick = (uuid: string) => router.push(`/finance/cashier?student=${uuid}`);

    return (
        <FinancePage title="Caixa" subtitle="Conta do aluno, pagamentos e recibos" icon={<Wallet size={24} />}>
            <div className={styles.filterBar} style={{ alignItems: 'center' }}>
                <StudentPicker autoFocus={!studentUuid} onSelect={student => pick(student.uuid)} />
                {account && (
                    <Button variant="secondary" icon={<X size={16} />} onClick={() => router.push('/finance/cashier')}>
                        Outro aluno
                    </Button>
                )}
            </div>

            {error && <div className={styles.card} role="alert">{error}</div>}

            {!studentUuid && (
                <div className={dash.rowHalf}>
                    <DashCard icon={<AlertTriangle size={16} />} tone="red" title="Alunos em atraso" subtitle="Toque para abrir a conta" link={{ href: '/finance/debtors', label: 'Ver todos' }}>
                        {!shortcuts ? (
                            <LoadingRows rows={4} />
                        ) : shortcuts.debtors.length === 0 ? (
                            <p className={dash.empty}>Nenhum aluno com pagamentos em atraso.</p>
                        ) : (
                            <div className={dash.list}>
                                {shortcuts.debtors.map(debtor => (
                                    <ListItem
                                        key={debtor.student.uuid}
                                        avatar={initials(debtor.student.name)}
                                        title={debtor.student.name}
                                        meta={`Nº ${debtor.student.number} · ${debtor.maxDaysOverdue} dia(s) de atraso`}
                                        value={formatMoney(debtor.total)}
                                        valueBad
                                        href={`/finance/cashier?student=${debtor.student.uuid}`}
                                    />
                                ))}
                            </div>
                        )}
                    </DashCard>
                    <DashCard icon={<Receipt size={16} />} tone="green" title="Últimos pagamentos" link={{ href: '/finance/payments', label: 'Recibos' }}>
                        {!shortcuts ? (
                            <LoadingRows rows={4} />
                        ) : shortcuts.payments.length === 0 ? (
                            <p className={dash.empty}>Ainda não há pagamentos. Pesquise um aluno acima para começar.</p>
                        ) : (
                            <div className={dash.list}>
                                {shortcuts.payments.map(payment => (
                                    <ListItem
                                        key={payment.uuid}
                                        avatar={initials(payment.student.name)}
                                        title={payment.student.name}
                                        meta={`${payment.receiptNumber} · ${formatDisplayDate(payment.paymentDate)} · ${payment.methodLabel}`}
                                        value={formatMoney(payment.amount)}
                                        href={`/finance/cashier?student=${payment.student.uuid}`}
                                    />
                                ))}
                            </div>
                        )}
                    </DashCard>
                </div>
            )}

            {studentUuid && !account && !error && <LoadingRows rows={6} />}

            {account && (
                <>
                    <section className={styles.tableCard} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className={styles.studentHeader}>
                            <div className={styles.person}>
                                <span className={styles.personAvatar} style={{ width: 48, height: 48, fontSize: 16, borderRadius: 14 }}>
                                    {initials(account.student.name)}
                                </span>
                                <span>
                                    <span className={styles.studentName}>{account.student.name}</span>
                                    <span className={styles.cellSub}>
                                        Nº {account.student.number}
                                        {account.enrollment ? ` · ${account.enrollment.gradeName} · Turma ${account.enrollment.className} · ${account.enrollment.academicYearName}` : ' · Sem matrícula ativa'}
                                    </span>
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {canManage && account.enrollment && (
                                    <Button variant="outline" icon={<CalendarPlus size={16} />} onClick={generate} isLoading={busy}>
                                        Gerar cobranças do ano
                                    </Button>
                                )}
                                {canManage && (
                                    <Button variant="secondary" icon={<FilePlus2 size={16} />} onClick={() => setDialog({ type: 'charge' })}>
                                        Nova cobrança
                                    </Button>
                                )}
                            </div>
                        </div>
                        {lastReceipt && (
                            <div className={styles.payBar} style={{ position: 'static', boxShadow: 'none', borderColor: 'rgba(5,150,105,.35)' }}>
                                <span className={styles.payBarText}>
                                    <CheckCircle2 size={16} style={{ verticalAlign: '-3px', color: 'var(--success)' }} /> Recibo <strong>{lastReceipt.number}</strong> emitido.
                                </span>
                                <Button variant="secondary" icon={<Printer size={16} />} onClick={() => router.push(`/finance/receipts/${lastReceipt.uuid}`)}>
                                    Ver e imprimir
                                </Button>
                            </div>
                        )}
                    </section>

                    <div className={dash.kpis}>
                        <KpiTile tone="blue" label="Total em dívida" icon={<Wallet size={18} />} value={formatMoney(account.totals.totalDue)} foot={<span>{account.totals.fines > 0 ? `Inclui multas de ${formatMoney(account.totals.fines)}` : 'Sem multas'}</span>} />
                        <KpiTile tone="red" label="Em atraso" icon={<AlertTriangle size={18} />} value={formatMoney(account.totals.overdue)} alert={account.totals.overdue > 0} foot={<span>{account.totals.overdueCount} cobrança(s) vencida(s)</span>} />
                        <KpiTile
                            tone="purple" label="Próximo vencimento"
                            icon={<CalendarClock size={18} />}
                            value={account.totals.nextDue ? formatMoney(account.totals.nextDue.totalDue) : '—'}
                            foot={<span>{account.totals.nextDue ? `${account.totals.nextDue.description} · ${formatDisplayDate(account.totals.nextDue.dueDate)}` : 'Nada a vencer'}</span>}
                        />
                        <KpiTile tone="green" label="Pago este ano" icon={<CheckCircle2 size={18} />} value={formatMoney(account.totals.paidThisYear)} foot={<span>{account.payments.filter(p => p.status === 'VALID').length} recibo(s) no total</span>} />
                    </div>

                    <TableCard
                        title="Cobranças"
                        hint={open.length ? `${open.length} em aberto · escolha o que vai pagar` : 'Nada em aberto'}
                        actions={
                            <label className={schedules.checkboxRow} style={{ fontSize: 13 }}>
                                <input type="checkbox" checked={showCancelled} onChange={event => setShowCancelled(event.target.checked)} />
                                Mostrar anuladas
                            </label>
                        }
                    >
                        {visibleCharges.length === 0 ? (
                            <EmptyBox
                                icon={<ListChecks size={24} />}
                                title="Sem cobranças"
                                text={account.enrollment && canManage ? 'Use “Gerar cobranças do ano” para aplicar a tabela de propinas a este aluno.' : 'Este aluno não tem valores a pagar.'}
                            />
                        ) : (
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        {canPay && (
                                            <th className={styles.checkCell}>
                                                <input
                                                    type="checkbox"
                                                    aria-label="Selecionar todas as cobranças em aberto"
                                                    checked={allSelected}
                                                    disabled={open.length === 0}
                                                    onChange={() => setSelected(allSelected ? new Set() : new Set(open.map(charge => charge.uuid)))}
                                                />
                                            </th>
                                        )}
                                        <th>Descrição</th>
                                        <th>Vencimento</th>
                                        <th className={styles.right}>Valor</th>
                                        <th className={styles.right}>Pago</th>
                                        <th className={styles.right}>Em dívida</th>
                                        <th>Estado</th>
                                        {canManage && <th className={styles.right}>Ações</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleCharges.map(charge => {
                                        const isOpen = charge.status === 'PENDING' || charge.status === 'PARTIAL';
                                        const isSelected = selected.has(charge.uuid);
                                        return (
                                            <tr
                                                key={charge.uuid}
                                                className={`${charge.status === 'CANCELLED' ? styles.rowMuted : ''} ${isSelected ? styles.rowSelected : ''} ${canPay && isOpen ? styles.rowClickable : ''}`}
                                                onClick={() => canPay && isOpen && toggle(charge.uuid)}
                                            >
                                                {canPay && (
                                                    <td onClick={event => event.stopPropagation()}>
                                                        {isOpen && <input type="checkbox" checked={isSelected} onChange={() => toggle(charge.uuid)} aria-label={`Incluir ${charge.description}`} />}
                                                    </td>
                                                )}
                                                <td>
                                                    <span className={styles.personName}>{charge.description}</span>
                                                    {charge.discount > 0 && <span className={styles.cellSub}>Desconto {formatMoney(charge.discount)}{charge.notes ? ` · ${charge.notes}` : ''}</span>}
                                                    {charge.cancelledReason && <span className={styles.cellSub}>Anulada: {charge.cancelledReason}</span>}
                                                </td>
                                                <td>
                                                    {formatDisplayDate(charge.dueDate)}
                                                    {charge.isOverdue && <span className={styles.cellSub}>há {charge.daysOverdue} dia(s)</span>}
                                                </td>
                                                <td className={styles.right}>{formatMoney(charge.amount)}</td>
                                                <td className={styles.right}>{charge.paidAmount + charge.finesPaid > 0 ? formatMoney(charge.paidAmount + charge.finesPaid) : '—'}</td>
                                                <td className={`${styles.right} ${styles.amountStrong} ${charge.isOverdue ? styles.danger : ''}`}>
                                                    {isOpen ? formatMoney(charge.totalDue) : '—'}
                                                    {charge.fineDue > 0 && <span className={styles.cellSub}>inclui multa {formatMoney(charge.fineDue)}</span>}
                                                </td>
                                                <td>
                                                    <ChargeStatusPill charge={charge} />
                                                </td>
                                                {canManage && (
                                                    <td onClick={event => event.stopPropagation()}>
                                                        {isOpen && (
                                                            <div className={styles.rowActionsRight}>
                                                                <ActionButton tone="orange" icon={<BadgePercent size={14} />} onClick={() => setDialog({ type: 'discount', charge })}>
                                                                    Desconto
                                                                </ActionButton>
                                                                {charge.paidAmount === 0 && charge.finesPaid === 0 && (
                                                                    <ActionButton tone="red" icon={<Ban size={14} />} onClick={() => setDialog({ type: 'cancel', charge })} aria-label="Anular" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </TableCard>

                    {canPay && open.length > 0 && (
                        <div className={styles.payBar}>
                            <span className={styles.payBarText}>
                                {selectedCharges.length ? `${selectedCharges.length} de ${open.length} cobrança(s) selecionada(s)` : 'Selecione as cobranças a pagar'}
                                {selectedCharges.length > 0 && <span className={styles.payBarAmount}>{formatMoney(selectedTotal)}</span>}
                            </span>
                            <Button variant="success" icon={<Wallet size={16} />} disabled={selectedCharges.length === 0} onClick={() => setDialog({ type: 'pay' })}>
                                Receber pagamento
                            </Button>
                        </div>
                    )}

                    <TableCard title="Recibos" hint={`${account.payments.length} recibo(s)`}>
                        {account.payments.length === 0 ? (
                            <EmptyBox icon={<Printer size={24} />} title="Ainda sem recibos" text="Os pagamentos registados aparecem aqui." />
                        ) : (
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Recibo</th>
                                        <th>Data</th>
                                        <th>Forma</th>
                                        <th className={styles.right}>Valor</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {account.payments.map(payment => (
                                        <tr key={payment.uuid} className={`${styles.rowClickable} ${payment.status === 'VOIDED' ? styles.rowMuted : ''}`} onClick={() => router.push(`/finance/receipts/${payment.uuid}`)}>
                                            <td>
                                                <span className={styles.linkStrong}>{payment.receiptNumber}</span>
                                            </td>
                                            <td>{formatDisplayDate(payment.paymentDate)}</td>
                                            <td>
                                                {payment.methodLabel}
                                                {payment.reference && <span className={styles.cellSub}>{payment.reference}</span>}
                                            </td>
                                            <td className={`${styles.right} ${styles.amountStrong}`}>{formatMoney(payment.amount)}</td>
                                            <td>
                                                {payment.status === 'VOIDED' ? (
                                                    <span className={`${styles.pill} ${styles.pillCancelled}`} title={payment.voidedReason ?? ''}>
                                                        Anulado
                                                    </span>
                                                ) : (
                                                    <span className={`${styles.pill} ${styles.pillPaid}`}>Válido</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </TableCard>
                </>
            )}

            {dialog?.type === 'pay' && account && (
                <PaymentDialog
                    studentUuid={account.student.uuid}
                    studentName={account.student.name}
                    charges={selectedCharges}
                    onClose={() => setDialog(null)}
                    onPaid={receipt => {
                        setDialog(null);
                        setLastReceipt({ uuid: receipt.uuid, number: receipt.receiptNumber });
                        load();
                    }}
                />
            )}
            {dialog?.type === 'discount' && <DiscountDialog charge={dialog.charge} onClose={() => setDialog(null)} onDone={() => { setDialog(null); load(); }} />}
            {dialog?.type === 'cancel' && <CancelDialog charge={dialog.charge} onClose={() => setDialog(null)} onDone={() => { setDialog(null); load(); }} />}
            {dialog?.type === 'charge' && account && (
                <ManualChargeDialog studentUuid={account.student.uuid} onClose={() => setDialog(null)} onDone={() => { setDialog(null); load(); }} />
            )}
        </FinancePage>
    );
}

const DiscountDialog: React.FC<{ charge: Charge; onClose: () => void; onDone: () => void }> = ({ charge, onClose, onDone }) => {
    const { showSuccess, showError } = useToast();
    const [value, setValue] = useState(charge.discount ? String(charge.discount).replace('.', ',') : '');
    const [notes, setNotes] = useState(charge.notes ?? '');
    const [saving, setSaving] = useState(false);
    const max = Math.round((charge.amount - charge.paidAmount) * 100) / 100;
    const discount = value.trim() ? parseAmount(value) : 0;
    const invalid = !Number.isFinite(discount) || discount < 0 || discount > max;

    const save = async () => {
        try {
            setSaving(true);
            await financeService.discountCharge(charge.uuid, discount, notes.trim() || null);
            showSuccess('Desconto aplicado', `${charge.description}: ${formatMoney(discount)}`);
            onDone();
        } catch (err) {
            showError('Não foi possível aplicar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={`Desconto · ${charge.description}`} size="md">
            <div className={schedules.dialogBody}>
                <p className={styles.muted}>
                    Valor {formatMoney(charge.amount)} · já pago {formatMoney(charge.paidAmount)}. O desconto pode ir até {formatMoney(max)}.
                </p>
                <label className={schedules.field} style={{ maxWidth: 'none' }}>
                    <span className={schedules.fieldLabel}>Desconto (MT)</span>
                    <input className={schedules.input} inputMode="decimal" value={value} onChange={event => setValue(event.target.value)} placeholder="0,00" />
                    {invalid && value.trim() && <span className={schedules.errorText}>Indique um valor entre 0 e {formatMoney(max)}</span>}
                </label>
                <label className={schedules.field} style={{ maxWidth: 'none' }}>
                    <span className={schedules.fieldLabel}>Motivo</span>
                    <input className={schedules.input} value={notes} maxLength={255} onChange={event => setNotes(event.target.value)} placeholder="Ex.: bolsa, irmãos na escola" />
                </label>
                <div className={schedules.dialogActions}>
                    <div className={schedules.dialogActionsRight}>
                        <Button variant="secondary" onClick={onClose} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={save} isLoading={saving} disabled={invalid}>
                            Aplicar desconto
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const CancelDialog: React.FC<{ charge: Charge; onClose: () => void; onDone: () => void }> = ({ charge, onClose, onDone }) => {
    const { showSuccess, showError } = useToast();
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const save = async () => {
        try {
            setSaving(true);
            await financeService.cancelCharge(charge.uuid, reason.trim());
            showSuccess('Cobrança anulada', charge.description);
            onDone();
        } catch (err) {
            showError('Não foi possível anular', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Anular cobrança" size="md">
            <div className={schedules.dialogBody}>
                <p className={styles.muted}>
                    “{charge.description}” ({formatMoney(charge.amount)}) deixa de ser devida. Fica no histórico como anulada.
                </p>
                <label className={schedules.field} style={{ maxWidth: 'none' }}>
                    <span className={schedules.fieldLabel}>Motivo *</span>
                    <input className={schedules.input} value={reason} maxLength={255} onChange={event => setReason(event.target.value)} placeholder="Ex.: lançada por engano" />
                </label>
                <div className={schedules.dialogActions}>
                    <div className={schedules.dialogActionsRight}>
                        <Button variant="secondary" onClick={onClose} disabled={saving}>
                            Voltar
                        </Button>
                        <Button variant="danger" onClick={save} isLoading={saving} disabled={reason.trim().length < 3}>
                            Anular cobrança
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const ManualChargeDialog: React.FC<{ studentUuid: string; onClose: () => void; onDone: () => void }> = ({ studentUuid, onClose, onDone }) => {
    const { showSuccess, showError } = useToast();
    const [types, setTypes] = useState<FeeType[]>([]);
    const [typeUuid, setTypeUuid] = useState('');
    const [description, setDescription] = useState('');
    const [amountText, setAmountText] = useState('');
    const [dueDate, setDueDate] = useState(todayIso());
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        financeService.feeTypes(true).then(setTypes).catch(() => setTypes([]));
    }, []);

    const amount = parseAmount(amountText);
    const valid = typeUuid && Number.isFinite(amount) && amount > 0 && dueDate;

    const save = async () => {
        try {
            setSaving(true);
            await financeService.createCharge({ studentUuid, feeTypeUuid: typeUuid, description: description.trim() || null, amount, dueDate });
            showSuccess('Cobrança criada', description || types.find(type => type.uuid === typeUuid)?.name || '');
            onDone();
        } catch (err) {
            showError('Não foi possível criar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title="Nova cobrança" size="md">
            <div className={schedules.dialogBody}>
                <div className={schedules.formGrid}>
                    <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Tipo *</span>
                        <select
                            className={schedules.nativeSelect}
                            value={typeUuid}
                            onChange={event => {
                                setTypeUuid(event.target.value);
                                const type = types.find(item => item.uuid === event.target.value);
                                if (type && !amountText && type.defaultAmount > 0) setAmountText(String(type.defaultAmount).replace('.', ','));
                            }}
                        >
                            <option value="">Escolha…</option>
                            {types.map(type => (
                                <option key={type.uuid} value={type.uuid}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        {types.length === 0 && <span className={styles.muted}>Crie primeiro os tipos de cobrança em Financeiro › Propinas.</span>}
                    </label>
                    <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Descrição</span>
                        <input className={schedules.input} value={description} maxLength={150} onChange={event => setDescription(event.target.value)} placeholder="Ex.: Uniforme (2 camisas)" />
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Valor (MT) *</span>
                        <input className={schedules.input} inputMode="decimal" value={amountText} onChange={event => setAmountText(event.target.value)} />
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Vencimento *</span>
                        <input type="date" className={schedules.input} value={dueDate} onChange={event => setDueDate(event.target.value)} />
                    </label>
                </div>
                <div className={schedules.dialogActions}>
                    <div className={schedules.dialogActionsRight}>
                        <Button variant="secondary" onClick={onClose} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={save} isLoading={saving} disabled={!valid}>
                            Criar cobrança
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default function CashierPage() {
    return (
        <Suspense fallback={null}>
            <CashierContent />
        </Suspense>
    );
}
