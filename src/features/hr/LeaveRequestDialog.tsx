'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { useToast } from '@/shared/contexts/ToastContext';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/utils/api.utils';
import { todayIso } from '@/features/finance/utils/format';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import finance from '@/features/finance/components/finance.module.css';
import { hrService, LEAVE_TYPE_LABELS, type Employee, type LeaveType } from './hr.service';

// Pedido de ausência: pelo RH (escolhe o funcionário) ou pelo próprio (self)
export const LeaveRequestDialog: React.FC<{ self?: boolean; availableVacation?: number; onClose: () => void; onSaved: () => void }> = ({ self, availableVacation, onClose, onSaved }) => {
    const { showSuccess, showError } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [employeeUuid, setEmployeeUuid] = useState('');
    const [leaveType, setLeaveType] = useState<LeaveType>('VACATION');
    const [startDate, setStartDate] = useState(todayIso());
    const [endDate, setEndDate] = useState(todayIso());
    const [reason, setReason] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (self) return;
        hrService.employees({ employmentStatus: 'ACTIVE', limit: 100 }).then(result => setEmployees(result.data)).catch(() => setEmployees([]));
    }, [self]);

    const save = async () => {
        const found: Record<string, string> = {};
        if (!self && !employeeUuid) found.employeeUuid = 'Escolha o funcionário';
        if (!startDate) found.startDate = 'Indique o início';
        if (!endDate || endDate < startDate) found.endDate = 'O fim não pode ser antes do início';
        setErrors(found);
        if (Object.keys(found).length) return;
        try {
            setSaving(true);
            const payload = { leaveType, startDate, endDate, reason: reason.trim() || null };
            const result = self ? await hrService.requestMyLeave(payload) : await hrService.createLeave({ ...payload, employeeUuid });
            showSuccess('Pedido registado', `${result.leaveTypeLabel}: ${result.days} dia(s) úteis. Aguarda aprovação.`);
            onSaved();
        } catch (err) {
            setErrors(getApiFieldErrors(err));
            showError('Não foi possível registar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={self ? 'Pedir férias ou ausência' : 'Registar ausência'} size="md">
            <div className={schedules.dialogBody}>
                <div className={schedules.formGrid}>
                    {!self && (
                        <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                            <span className={schedules.fieldLabel}>Funcionário *</span>
                            <select className={schedules.nativeSelect} value={employeeUuid} onChange={event => setEmployeeUuid(event.target.value)}>
                                <option value="">Escolha…</option>
                                {employees.map(item => (
                                    <option key={item.uuid} value={item.uuid}>
                                        {item.fullName} ({item.employeeNumber})
                                    </option>
                                ))}
                            </select>
                            {errors.employeeUuid && <span className={schedules.errorText}>{errors.employeeUuid}</span>}
                        </label>
                    )}
                    <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Tipo</span>
                        <select className={schedules.nativeSelect} value={leaveType} onChange={event => setLeaveType(event.target.value as LeaveType)}>
                            {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        {leaveType === 'VACATION' && availableVacation !== undefined && <span className={finance.muted}>Tem {availableVacation} dia(s) de férias disponíveis este ano.</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>De *</span>
                        <input type="date" className={schedules.input} value={startDate} onChange={event => { setStartDate(event.target.value); if (endDate < event.target.value) setEndDate(event.target.value); }} />
                        {errors.startDate && <span className={schedules.errorText}>{errors.startDate}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Até *</span>
                        <input type="date" className={schedules.input} value={endDate} min={startDate} onChange={event => setEndDate(event.target.value)} />
                        {errors.endDate && <span className={schedules.errorText}>{errors.endDate}</span>}
                    </label>
                    <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Motivo / observações</span>
                        <input className={schedules.input} value={reason} maxLength={500} onChange={event => setReason(event.target.value)} />
                    </label>
                </div>
                <p className={finance.muted}>Contam só os dias úteis: os fins de semana e os feriados do calendário escolar não são descontados.</p>
                <div className={schedules.dialogActions}>
                    <div className={schedules.dialogActionsRight}>
                        <Button variant="secondary" onClick={onClose} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={save} isLoading={saving}>
                            {self ? 'Enviar pedido' : 'Registar'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
