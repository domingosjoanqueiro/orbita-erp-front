// src/app/(dashboard)/finance/receipts/[uuid]/page.tsx

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Ban, Printer } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { useToast } from '@/shared/contexts/ToastContext';
import { usePermission } from '@/shared/hooks/usePermission';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { financeService } from '@/features/finance/services/finance.service';
import type { Receipt } from '@/features/finance/types/finance.types';
import { formatMoney, formatMonth } from '@/features/finance/utils/format';
import evaluation from '@/features/academic/assessments/styles/evaluation.module.css';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import styles from '@/features/finance/components/finance.module.css';

export default function ReceiptPage() {
    const { uuid } = useParams<{ uuid: string }>();
    const { showSuccess, showError } = useToast();
    const { hasPermission } = usePermission();
    const canVoid = hasPermission('finance.void');
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [voiding, setVoiding] = useState(false);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            setReceipt(await financeService.receipt(uuid));
        } catch (err) {
            setError(getApiErrorMessage(err, 'Não foi possível carregar o recibo.'));
        }
    }, [uuid]);

    useEffect(() => {
        load();
    }, [load]);

    const voidReceipt = async () => {
        try {
            setBusy(true);
            setReceipt(await financeService.voidPayment(uuid, reason.trim()));
            showSuccess('Recibo anulado', 'As cobranças voltaram a ficar em dívida.');
            setVoiding(false);
        } catch (err) {
            showError('Não foi possível anular', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setBusy(false);
        }
    };

    if (error) return <div className={`${evaluation.banner} ${evaluation.bannerWarning}`}>{error}</div>;
    if (!receipt) return <p className={styles.muted}>A carregar…</p>;

    const money = (value: number) => formatMoney(value, receipt.company.currency);

    return (
        <div className={evaluation.page}>
            <div className={schedules.noPrint} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <Link href={`/finance/cashier?student=${receipt.student.uuid}`} className={styles.linkButton} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ArrowLeft size={16} /> Conta do aluno
                </Link>
                <div style={{ display: 'flex', gap: 8 }}>
                    {canVoid && receipt.status === 'VALID' && (
                        <Button variant="outline" icon={<Ban size={16} />} onClick={() => setVoiding(true)}>
                            Anular recibo
                        </Button>
                    )}
                    <Button icon={<Printer size={16} />} onClick={() => window.print()}>
                        Imprimir
                    </Button>
                </div>
            </div>

            <article className={styles.receipt}>
                <header className={styles.receiptHead}>
                    <div>
                        <div className={styles.receiptCompany}>{receipt.company.legalName || receipt.company.name}</div>
                        {receipt.company.taxNumber && <div>NUIT: {receipt.company.taxNumber}</div>}
                        {receipt.company.address && <div>{receipt.company.address}</div>}
                        {(receipt.company.phone || receipt.company.email) && <div>{[receipt.company.phone, receipt.company.email].filter(Boolean).join(' · ')}</div>}
                    </div>
                    <div className={styles.receiptTitle}>
                        <div style={{ textTransform: 'uppercase', fontSize: 12, color: '#6B7280', fontWeight: 700 }}>Recibo</div>
                        <div className={styles.receiptNumber}>{receipt.receiptNumber}</div>
                        <div>{formatDisplayDate(receipt.paymentDate)}</div>
                    </div>
                </header>

                {receipt.status === 'VOIDED' && (
                    <div>
                        <span className={styles.voidStamp}>ANULADO</span>
                        {receipt.voidedReason && <p>Motivo: {receipt.voidedReason}</p>}
                    </div>
                )}

                <div className={styles.receiptGrid}>
                    <div>
                        <strong>Aluno:</strong> {receipt.student.name}
                    </div>
                    <div>
                        <strong>Nº:</strong> {receipt.student.number}
                    </div>
                    {receipt.class && (
                        <div>
                            <strong>Turma:</strong> {receipt.class.gradeName} · {receipt.class.name} ({receipt.class.academicYearName})
                        </div>
                    )}
                    <div>
                        <strong>Forma de pagamento:</strong> {receipt.methodLabel}
                        {receipt.reference ? ` · ref. ${receipt.reference}` : ''}
                    </div>
                </div>

                <table className={styles.receiptTable}>
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th style={{ textAlign: 'right' }}>Valor</th>
                            <th style={{ textAlign: 'right' }}>Multa</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receipt.items.map(item => (
                            <tr key={item.chargeUuid}>
                                <td>
                                    {item.description}
                                    {item.referenceMonth && !item.description.toLowerCase().includes(formatMonth(item.referenceMonth).split(' ')[0]) ? ` (${formatMonth(item.referenceMonth)})` : ''}
                                </td>
                                <td style={{ textAlign: 'right' }}>{money(item.amount)}</td>
                                <td style={{ textAlign: 'right' }}>{item.fineAmount ? money(item.fineAmount) : '—'}</td>
                                <td style={{ textAlign: 'right' }}>{money(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className={styles.receiptTotal}>
                    <span>Total recebido</span>
                    <span>{money(receipt.amount)}</span>
                </div>
                {receipt.notes && <p style={{ marginTop: 12 }}>Obs.: {receipt.notes}</p>}

                <footer className={styles.receiptFooter}>
                    <div>
                        Emitido por {receipt.receivedBy ?? '—'}
                        <br />
                        Processado pelo Orbita ERP
                    </div>
                    <div className={styles.signature}>Assinatura e carimbo</div>
                </footer>
            </article>

            {voiding && (
                <Modal isOpen onClose={() => setVoiding(false)} title={`Anular recibo ${receipt.receiptNumber}`} size="md">
                    <div className={schedules.dialogBody}>
                        <p className={styles.muted}>
                            O valor de {money(receipt.amount)} deixa de contar e as cobranças pagas por este recibo voltam a ficar em dívida. O recibo fica no histórico como anulado.
                        </p>
                        <label className={schedules.field} style={{ maxWidth: 'none' }}>
                            <span className={schedules.fieldLabel}>Motivo *</span>
                            <input className={schedules.input} value={reason} maxLength={255} onChange={event => setReason(event.target.value)} placeholder="Ex.: valor registado no aluno errado" />
                        </label>
                        <div className={schedules.dialogActions}>
                            <div className={schedules.dialogActionsRight}>
                                <Button variant="secondary" onClick={() => setVoiding(false)} disabled={busy}>
                                    Voltar
                                </Button>
                                <Button variant="danger" onClick={voidReceipt} isLoading={busy} disabled={reason.trim().length < 3}>
                                    Anular recibo
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
