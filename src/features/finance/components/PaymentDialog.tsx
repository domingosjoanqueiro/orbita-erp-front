'use client';

import React, { useMemo, useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/utils/api.utils';
import { financeService } from '../services/finance.service';
import { METHODS_WITH_REFERENCE, PAYMENT_METHOD_LABELS, type Charge, type PaymentMethod, type Receipt } from '../types/finance.types';
import { formatMoney, parseAmount, todayIso } from '../utils/format';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import styles from './finance.module.css';

interface PaymentDialogProps {
    studentUuid: string;
    studentName: string;
    // cobranças em aberto escolhidas (por ordem de vencimento)
    charges: Charge[];
    onClose: () => void;
    onPaid: (receipt: Receipt) => void;
}

/*
 * Pré-visualização da distribuição igual à da API: por vencimento, multa
 * primeiro e depois o capital.
 */
function allocate(charges: Charge[], amount: number) {
    let remaining = amount;
    return charges.map(charge => {
        const fine = Math.min(remaining, charge.fineDue);
        remaining = Math.round((remaining - fine) * 100) / 100;
        const principal = Math.min(remaining, charge.balance);
        remaining = Math.round((remaining - principal) * 100) / 100;
        return { charge, fine, principal, settles: principal >= charge.balance - 0.001 };
    });
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({ studentUuid, studentName, charges, onClose, onPaid }) => {
    const { showSuccess, showError } = useToast();
    const total = useMemo(() => Math.round(charges.reduce((sum, charge) => sum + charge.totalDue, 0) * 100) / 100, [charges]);
    const [amountText, setAmountText] = useState(total.toFixed(2).replace('.', ','));
    const [method, setMethod] = useState<PaymentMethod>('CASH');
    const [reference, setReference] = useState('');
    const [date, setDate] = useState(todayIso());
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const amount = parseAmount(amountText);
    const preview = Number.isFinite(amount) && amount > 0 ? allocate(charges, Math.min(amount, total)) : [];
    const needsReference = METHODS_WITH_REFERENCE.includes(method);

    const submit = async () => {
        const found: Record<string, string> = {};
        if (!Number.isFinite(amount) || amount <= 0) found.amount = 'Indique um valor maior que 0';
        else if (amount > total + 0.001) found.amount = `Não pode passar de ${formatMoney(total)}`;
        if (needsReference && !reference.trim()) found.reference = 'Indique a referência da transação';
        if (!date) found.paymentDate = 'Indique a data';
        else if (date > todayIso()) found.paymentDate = 'Não pode ser uma data futura';
        setErrors(found);
        if (Object.keys(found).length) return;
        try {
            setSaving(true);
            const receipt = await financeService.createPayment({
                studentUuid,
                paymentDate: date,
                method,
                reference: reference.trim() || null,
                amount,
                chargeUuids: charges.map(charge => charge.uuid),
                notes: notes.trim() || null,
            });
            showSuccess('Pagamento registado', `Recibo ${receipt.receiptNumber} · ${formatMoney(receipt.amount)}`);
            onPaid(receipt);
        } catch (error) {
            setErrors(getApiFieldErrors(error));
            showError('Não foi possível registar', getApiErrorMessage(error, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={`Registar pagamento · ${studentName}`} size="lg">
            <div className={schedules.dialogBody}>
                <div className={schedules.formGrid}>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Valor recebido (MT)</span>
                        <input className={schedules.input} inputMode="decimal" value={amountText} onChange={event => setAmountText(event.target.value)} />
                        {errors.amount && <span className={schedules.errorText}>{errors.amount}</span>}
                        <span className={styles.muted}>Total em dívida das cobranças escolhidas: {formatMoney(total)}</span>
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Data do pagamento</span>
                        <input type="date" className={schedules.input} value={date} max={todayIso()} onChange={event => setDate(event.target.value)} />
                        {errors.paymentDate && <span className={schedules.errorText}>{errors.paymentDate}</span>}
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
                        <span className={schedules.fieldLabel}>Referência {needsReference ? '*' : '(opcional)'}</span>
                        <input
                            className={schedules.input}
                            value={reference}
                            maxLength={100}
                            placeholder={method === 'MPESA' || method === 'EMOLA' ? 'Código da transação' : 'Nº do talão / transferência'}
                            onChange={event => setReference(event.target.value)}
                        />
                        {errors.reference && <span className={schedules.errorText}>{errors.reference}</span>}
                    </label>
                    <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Observações</span>
                        <input className={schedules.input} value={notes} maxLength={255} onChange={event => setNotes(event.target.value)} />
                    </label>
                </div>

                <div>
                    <p className={schedules.fieldLabel} style={{ marginBottom: 6 }}>Como o valor fica distribuído</p>
                    <table className={styles.receiptTable} style={{ color: 'var(--text-primary)' }}>
                        <thead>
                            <tr>
                                <th>Cobrança</th>
                                <th className={styles.amount}>Multa</th>
                                <th className={styles.amount}>Capital</th>
                                <th>Fica</th>
                            </tr>
                        </thead>
                        <tbody>
                            {charges.map((charge, index) => {
                                const item = preview[index];
                                return (
                                    <tr key={charge.uuid}>
                                        <td>{charge.description}</td>
                                        <td className={styles.amount}>{formatMoney(item?.fine ?? 0)}</td>
                                        <td className={styles.amount}>{formatMoney(item?.principal ?? 0)}</td>
                                        <td>{!item || item.fine + item.principal === 0 ? 'Por pagar' : item.settles ? 'Paga' : 'Paga em parte'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className={schedules.dialogActions}>
                    <div className={schedules.dialogActionsRight}>
                        <Button variant="secondary" onClick={onClose} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button variant="success" onClick={submit} isLoading={saving}>
                            Registar e emitir recibo
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
