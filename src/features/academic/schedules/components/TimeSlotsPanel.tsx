'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Coffee, Edit, Plus, Trash2, Wand2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { useToast } from '@/shared/contexts/ToastContext';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/utils/api.utils';
import { scheduleService } from '../services/schedule.service';
import { SHIFT_LABELS, type GenerateTimeSlotsInput, type Shift, type TimeSlot } from '../types/schedule.types';
import evaluation from '@/features/academic/assessments/styles/evaluation.module.css';
import styles from './Schedules.module.css';

const SHIFTS: Shift[] = ['MORNING', 'AFTERNOON', 'EVENING'];

const DEFAULT_START: Record<Shift, string> = { MORNING: '07:00', AFTERNOON: '12:30', EVENING: '18:00' };

const toMinutes = (value: string) => {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
};
const fromMinutes = (total: number) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

// Pré-visualização igual ao que a API vai gerar
function previewSlots(input: GenerateTimeSlotsInput) {
    const rows: { name: string; start: string; end: string; isBreak: boolean }[] = [];
    if (!/^\d{2}:\d{2}$/.test(input.startTime) || input.lessons < 1 || input.lessonMinutes < 1) return rows;
    let cursor = toMinutes(input.startTime);
    for (let lesson = 1; lesson <= input.lessons; lesson++) {
        rows.push({ name: `${lesson}.º tempo`, start: fromMinutes(cursor), end: fromMinutes(cursor + input.lessonMinutes), isBreak: false });
        cursor += input.lessonMinutes;
        if (input.breakAfter > 0 && input.breakMinutes > 0 && lesson === input.breakAfter && lesson < input.lessons) {
            rows.push({ name: 'Intervalo', start: fromMinutes(cursor), end: fromMinutes(cursor + input.breakMinutes), isBreak: true });
            cursor += input.breakMinutes;
        }
    }
    return rows;
}

interface SlotForm {
    uuid?: string;
    name: string;
    startTime: string;
    endTime: string;
    isBreak: boolean;
}

export const TimeSlotsPanel: React.FC<{ canManage: boolean }> = ({ canManage }) => {
    const { showSuccess, showError } = useToast();
    const [shift, setShift] = useState<Shift>('MORNING');
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<SlotForm | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [generator, setGenerator] = useState<GenerateTimeSlotsInput | null>(null);
    const [toDelete, setToDelete] = useState<TimeSlot | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setSlots(await scheduleService.listTimeSlots(shift));
        } catch (error) {
            showError('Erro', getApiErrorMessage(error, 'Não foi possível carregar os tempos letivos.'));
        } finally {
            setLoading(false);
        }
    }, [shift]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        load();
    }, [load]);

    const preview = useMemo(() => (generator ? previewSlots(generator) : []), [generator]);

    const saveSlot = async () => {
        if (!form) return;
        const errors: Record<string, string> = {};
        if (!form.startTime) errors.startTime = 'Indique a hora de início';
        if (!form.endTime) errors.endTime = 'Indique a hora de fim';
        if (form.startTime && form.endTime && form.endTime <= form.startTime) errors.endTime = 'Tem de ser depois do início';
        setFormErrors(errors);
        if (Object.keys(errors).length) return;
        try {
            setBusy(true);
            const payload = { shift, name: form.name.trim() || null, startTime: form.startTime, endTime: form.endTime, isBreak: form.isBreak };
            if (form.uuid) await scheduleService.updateTimeSlot(form.uuid, payload);
            else await scheduleService.createTimeSlot(payload);
            showSuccess(form.uuid ? 'Tempo atualizado' : 'Tempo adicionado', `${form.startTime}–${form.endTime}`);
            setForm(null);
            await load();
        } catch (error) {
            setFormErrors(getApiFieldErrors(error));
            showError('Não foi possível guardar', getApiErrorMessage(error, 'Tente novamente.'));
        } finally {
            setBusy(false);
        }
    };

    const generate = async () => {
        if (!generator) return;
        try {
            setBusy(true);
            await scheduleService.generateTimeSlots(generator);
            showSuccess('Tempos gerados', `${preview.length} tempo(s) no turno da ${SHIFT_LABELS[shift].toLowerCase()}.`);
            setGenerator(null);
            await load();
        } catch (error) {
            showError('Não foi possível gerar', getApiErrorMessage(error, 'Tente novamente.'));
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!toDelete) return;
        try {
            setBusy(true);
            await scheduleService.removeTimeSlot(toDelete.uuid);
            showSuccess('Tempo removido', toDelete.name);
            setToDelete(null);
            await load();
        } catch (error) {
            showError('Não foi possível remover', getApiErrorMessage(error, 'Tente novamente.'));
            setToDelete(null);
        } finally {
            setBusy(false);
        }
    };

    const lessonsCount = slots.filter(slot => !slot.isBreak).length;

    return (
        <div className={evaluation.panel}>
            <div className={styles.toolbar}>
                <div className={evaluation.chipGroup} role="tablist" aria-label="Turno">
                    {SHIFTS.map(item => (
                        <button
                            key={item}
                            type="button"
                            role="tab"
                            aria-selected={shift === item}
                            className={`${evaluation.chip} ${shift === item ? evaluation.active : ''}`}
                            onClick={() => setShift(item)}
                        >
                            {SHIFT_LABELS[item]}
                        </button>
                    ))}
                </div>
                {canManage && (
                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
                        <Button
                            variant="outline"
                            icon={<Wand2 size={16} />}
                            onClick={() =>
                                setGenerator({ shift, startTime: DEFAULT_START[shift], lessonMinutes: 45, lessons: 6, breakAfter: 3, breakMinutes: 15, replace: slots.length > 0 })
                            }
                        >
                            Gerar tempos
                        </Button>
                        <Button icon={<Plus size={16} />} onClick={() => setForm({ name: '', startTime: '', endTime: '', isBreak: false })}>
                            Adicionar tempo
                        </Button>
                    </div>
                )}
            </div>

            <p className={styles.muted} style={{ margin: '12px 0' }}>
                Turno da {SHIFT_LABELS[shift].toLowerCase()}: {lessonsCount} tempo(s) letivo(s). Os tempos aplicam-se a todas as turmas deste turno.
            </p>

            {loading ? (
                <p className={styles.muted}>A carregar…</p>
            ) : slots.length === 0 ? (
                <div className={evaluation.emptyState}>
                    <Clock size={40} className={evaluation.emptyIcon} />
                    <p className={evaluation.emptyTitle}>Sem tempos neste turno</p>
                    <p>Use &quot;Gerar tempos&quot; para criar a grelha de uma vez (ex.: 6 tempos de 45 minutos com intervalo).</p>
                </div>
            ) : (
                <div className={evaluation.tableWrapper}>
                    <table className={evaluation.table}>
                        <thead>
                            <tr>
                                <th>Tempo</th>
                                <th>Início</th>
                                <th>Fim</th>
                                <th>Duração</th>
                                <th>Tipo</th>
                                {canManage && <th style={{ textAlign: 'right' }}>Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map(slot => (
                                <tr key={slot.uuid}>
                                    <td>
                                        <strong>{slot.name}</strong>
                                    </td>
                                    <td className={evaluation.numeric}>{slot.startTime}</td>
                                    <td className={evaluation.numeric}>{slot.endTime}</td>
                                    <td className={evaluation.numeric}>{toMinutes(slot.endTime) - toMinutes(slot.startTime)} min</td>
                                    <td>
                                        {slot.isBreak ? (
                                            <span className={evaluation.muted}>
                                                <Coffee size={13} style={{ verticalAlign: '-2px' }} /> Intervalo
                                            </span>
                                        ) : (
                                            'Aula'
                                        )}
                                    </td>
                                    {canManage && (
                                        <td>
                                            <div className={evaluation.rowActions} style={{ justifyContent: 'flex-end' }}>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    icon={<Edit size={14} />}
                                                    onClick={() => setForm({ uuid: slot.uuid, name: slot.name, startTime: slot.startTime, endTime: slot.endTime, isBreak: slot.isBreak })}
                                                >
                                                    Editar
                                                </Button>
                                                <Button size="sm" variant="outline" icon={<Trash2 size={14} />} onClick={() => setToDelete(slot)}>
                                                    Remover
                                                </Button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {form && (
                <Modal isOpen onClose={() => setForm(null)} title={form.uuid ? 'Editar tempo' : `Novo tempo · ${SHIFT_LABELS[shift]}`} size="md">
                    <div className={styles.dialogBody}>
                        <div className={styles.formGrid}>
                            <label className={`${styles.field} ${styles.fullRow}`} style={{ maxWidth: 'none' }}>
                                <span className={styles.fieldLabel}>Nome</span>
                                <input
                                    className={styles.input}
                                    value={form.name}
                                    maxLength={50}
                                    placeholder={form.isBreak ? 'Intervalo' : 'Automático (ex.: 3.º tempo)'}
                                    onChange={event => setForm({ ...form, name: event.target.value })}
                                />
                            </label>
                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Início</span>
                                <input className={styles.input} type="time" value={form.startTime} onChange={event => setForm({ ...form, startTime: event.target.value })} />
                                {formErrors.startTime && <span className={styles.errorText}>{formErrors.startTime}</span>}
                            </label>
                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Fim</span>
                                <input className={styles.input} type="time" value={form.endTime} onChange={event => setForm({ ...form, endTime: event.target.value })} />
                                {formErrors.endTime && <span className={styles.errorText}>{formErrors.endTime}</span>}
                            </label>
                            <label className={`${styles.checkboxRow} ${styles.fullRow}`}>
                                <input type="checkbox" checked={form.isBreak} onChange={event => setForm({ ...form, isBreak: event.target.checked })} />
                                É um intervalo (não recebe aulas)
                            </label>
                        </div>
                        <div className={styles.dialogActions}>
                            <div className={styles.dialogActionsRight}>
                                <Button variant="secondary" onClick={() => setForm(null)} disabled={busy}>
                                    Cancelar
                                </Button>
                                <Button onClick={saveSlot} isLoading={busy}>
                                    Guardar
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {generator && (
                <Modal isOpen onClose={() => setGenerator(null)} title={`Gerar tempos · ${SHIFT_LABELS[shift]}`} size="lg">
                    <div className={styles.dialogBody}>
                        <div className={styles.formGrid}>
                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Primeiro tempo começa às</span>
                                <input className={styles.input} type="time" value={generator.startTime} onChange={event => setGenerator({ ...generator, startTime: event.target.value })} />
                            </label>
                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Duração de cada tempo (min)</span>
                                <input className={styles.input} type="number" min={20} max={120} value={generator.lessonMinutes} onChange={event => setGenerator({ ...generator, lessonMinutes: Number(event.target.value) })} />
                            </label>
                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Número de tempos</span>
                                <input className={styles.input} type="number" min={1} max={12} value={generator.lessons} onChange={event => setGenerator({ ...generator, lessons: Number(event.target.value) })} />
                            </label>
                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Intervalo depois do tempo nº (0 = sem)</span>
                                <input className={styles.input} type="number" min={0} max={12} value={generator.breakAfter} onChange={event => setGenerator({ ...generator, breakAfter: Number(event.target.value) })} />
                            </label>
                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Duração do intervalo (min)</span>
                                <input className={styles.input} type="number" min={0} max={60} value={generator.breakMinutes} onChange={event => setGenerator({ ...generator, breakMinutes: Number(event.target.value) })} />
                            </label>
                            {slots.length > 0 && (
                                <label className={`${styles.checkboxRow} ${styles.fullRow}`}>
                                    <input type="checkbox" checked={generator.replace} onChange={event => setGenerator({ ...generator, replace: event.target.checked })} />
                                    Substituir os {slots.length} tempos atuais deste turno (só é possível se ainda não tiverem aulas)
                                </label>
                            )}
                        </div>

                        <div className={evaluation.tableWrapper}>
                            <table className={evaluation.table}>
                                <thead>
                                    <tr>
                                        <th>Pré-visualização</th>
                                        <th>Início</th>
                                        <th>Fim</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map(row => (
                                        <tr key={`${row.name}-${row.start}`}>
                                            <td>{row.isBreak ? <em>{row.name}</em> : row.name}</td>
                                            <td className={evaluation.numeric}>{row.start}</td>
                                            <td className={evaluation.numeric}>{row.end}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.dialogActions}>
                            <div className={styles.dialogActionsRight}>
                                <Button variant="secondary" onClick={() => setGenerator(null)} disabled={busy}>
                                    Cancelar
                                </Button>
                                <Button onClick={generate} isLoading={busy} disabled={preview.length === 0 || (slots.length > 0 && !generator.replace)}>
                                    Gerar {preview.length} tempo(s)
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            <ConfirmDialog
                isOpen={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={remove}
                title="Remover tempo"
                message={`Remover "${toDelete?.name}" (${toDelete?.startTime}–${toDelete?.endTime})? Só é possível se não tiver aulas marcadas.`}
                type="danger"
                confirmText="Remover"
                isLoading={busy}
            />
        </div>
    );
};
