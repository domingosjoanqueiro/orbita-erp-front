'use client';

import React, { useEffect, useState } from 'react';
import { CalendarClock, DoorOpen, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { useToast } from '@/shared/contexts/ToastContext';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { scheduleService } from '../services/schedule.service';
import type { ScheduleEntry, ScheduleOptions, TimeSlot, Weekday } from '../types/schedule.types';
import styles from './Schedules.module.css';

interface LessonDialogProps {
    classUuid: string;
    // aula nova: dia + tempo; edição: a aula
    target: { weekday: number; slot: TimeSlot; entry?: ScheduleEntry } | null;
    weekdays: Weekday[];
    defaultRoomName?: string | null;
    onClose: () => void;
    onSaved: () => void;
}

export const LessonDialog: React.FC<LessonDialogProps> = ({ classUuid, target, weekdays, defaultRoomName, onClose, onSaved }) => {
    const { showSuccess, showError } = useToast();
    const [options, setOptions] = useState<ScheduleOptions | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [assignmentUuid, setAssignmentUuid] = useState('');
    const [roomUuid, setRoomUuid] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(false);

    const entry = target?.entry;

    useEffect(() => {
        if (!target) return;
        let cancelled = false;
        setOptions(null);
        setLoadError(null);
        setConfirmRemove(false);
        setAssignmentUuid(target.entry?.teacherAssignmentUuid ?? '');
        setNotes(target.entry?.notes ?? '');
        scheduleService
            .options(classUuid, target.weekday, target.slot.uuid, target.entry?.uuid)
            .then(result => {
                if (cancelled) return;
                setOptions(result);
                if (target.entry) {
                    setRoomUuid(target.entry.room?.uuid ?? '');
                } else {
                    // sala habitual da turma, se existir e estiver livre
                    const preferred = result.rooms.find(
                        room => !room.busy && defaultRoomName && [room.code, room.name].some(v => v.toLowerCase() === defaultRoomName.toLowerCase())
                    );
                    setRoomUuid(preferred?.uuid ?? '');
                }
            })
            .catch(error => {
                if (!cancelled) setLoadError(getApiErrorMessage(error, 'Não foi possível carregar as opções.'));
            });
        return () => {
            cancelled = true;
        };
    }, [target, classUuid, defaultRoomName]);

    if (!target) return null;

    const dayName = weekdays.find(day => day.value === target.weekday)?.name ?? '';

    const save = async () => {
        if (!assignmentUuid) {
            showError('Falta a disciplina', 'Escolha a disciplina e o professor da aula.');
            return;
        }
        try {
            setSaving(true);
            const payload = {
                weekday: target.weekday,
                timeSlotUuid: target.slot.uuid,
                teacherAssignmentUuid: assignmentUuid,
                roomUuid: roomUuid || null,
                notes: notes.trim() || null,
            };
            if (entry) {
                await scheduleService.updateEntry(entry.uuid, payload);
                showSuccess('Aula atualizada', `${dayName}, ${target.slot.name}.`);
            } else {
                await scheduleService.createEntry({ classUuid, ...payload });
                showSuccess('Aula marcada', `${dayName}, ${target.slot.name}.`);
            }
            onSaved();
        } catch (error) {
            showError('Não foi possível guardar', getApiErrorMessage(error, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!entry) return;
        try {
            setSaving(true);
            await scheduleService.removeEntry(entry.uuid);
            showSuccess('Aula removida', `${dayName}, ${target.slot.name}.`);
            onSaved();
        } catch (error) {
            showError('Não foi possível remover', getApiErrorMessage(error, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={entry ? 'Editar aula' : 'Marcar aula'} size="lg">
            <div className={styles.dialogBody}>
                <div className={styles.when}>
                    <CalendarClock size={18} />
                    <span>
                        <strong>{dayName}</strong> · {target.slot.name} ({target.slot.startTime}–{target.slot.endTime})
                    </span>
                </div>

                {loadError ? (
                    <p className={styles.errorText}>{loadError}</p>
                ) : !options ? (
                    <p className={styles.muted}>A carregar opções…</p>
                ) : (
                    <>
                        <div>
                            <p className={styles.fieldLabel} style={{ marginBottom: 8 }}>Disciplina e professor</p>
                            {options.assignments.length === 0 ? (
                                <p className={styles.muted}>
                                    Esta turma ainda não tem disciplinas atribuídas. Crie as atribuições em Académico › Atribuições.
                                </p>
                            ) : (
                                <div className={styles.optionList} role="radiogroup" aria-label="Disciplina e professor">
                                    {options.assignments.map(option => {
                                        const selected = option.uuid === assignmentUuid;
                                        const blocked = !!option.teacherBusy && !selected;
                                        return (
                                            <button
                                                key={option.uuid}
                                                type="button"
                                                role="radio"
                                                aria-checked={selected}
                                                disabled={blocked}
                                                className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                                                onClick={() => setAssignmentUuid(option.uuid)}
                                            >
                                                <span className={styles.optionTitle}>{option.subjectName}</span>
                                                <span className={styles.optionMeta}>{option.teacherName}</span>
                                                <span className={styles.optionMeta}>
                                                    {option.weeklyWorkload
                                                        ? `${option.scheduledCount} de ${option.weeklyWorkload} tempos por semana`
                                                        : `${option.scheduledCount} tempo(s) marcados`}
                                                </span>
                                                {option.teacherBusy && (
                                                    <span className={styles.optionWarn}>Professor ocupado: {option.teacherBusy}</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div>
                            <p className={styles.fieldLabel} style={{ marginBottom: 8 }}>
                                <DoorOpen size={13} style={{ verticalAlign: '-2px' }} /> Sala
                            </p>
                            <div className={styles.optionList} role="radiogroup" aria-label="Sala">
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={roomUuid === ''}
                                    className={`${styles.option} ${roomUuid === '' ? styles.optionSelected : ''}`}
                                    onClick={() => setRoomUuid('')}
                                >
                                    <span className={styles.optionTitle}>Sem sala definida</span>
                                    <span className={styles.optionMeta}>Escolher mais tarde</span>
                                </button>
                                {options.rooms.map(room => {
                                    const selected = room.uuid === roomUuid;
                                    return (
                                        <button
                                            key={room.uuid}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            disabled={!!room.busy && !selected}
                                            className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                                            onClick={() => setRoomUuid(room.uuid)}
                                        >
                                            <span className={styles.optionTitle}>
                                                {room.code} · {room.name}
                                            </span>
                                            <span className={styles.optionMeta}>
                                                {room.capacity ? `${room.capacity} lugares` : 'Capacidade não indicada'}
                                            </span>
                                            {room.busy && <span className={styles.optionWarn}>Ocupada: {room.busy}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            {options.rooms.length === 0 && (
                                <p className={styles.muted} style={{ marginTop: 6 }}>
                                    Ainda não há salas registadas (Académico › Salas).
                                </p>
                            )}
                        </div>

                        <label className={styles.field} style={{ maxWidth: 'none' }}>
                            <span className={styles.fieldLabel}>Observações</span>
                            <input
                                className={styles.input}
                                value={notes}
                                maxLength={255}
                                onChange={event => setNotes(event.target.value)}
                                placeholder="Opcional (ex.: aula prática)"
                            />
                        </label>
                    </>
                )}

                <div className={styles.dialogActions}>
                    {entry && (
                        confirmRemove ? (
                            <Button variant="danger" icon={<Trash2 size={16} />} onClick={remove} isLoading={saving}>
                                Confirmar remoção
                            </Button>
                        ) : (
                            <Button variant="outline" icon={<Trash2 size={16} />} onClick={() => setConfirmRemove(true)} disabled={saving}>
                                Remover aula
                            </Button>
                        )
                    )}
                    <div className={styles.dialogActionsRight}>
                        <Button variant="secondary" onClick={onClose} disabled={saving}>
                            Cancelar
                        </Button>
                        <Button onClick={save} isLoading={saving} disabled={saving || !options || !assignmentUuid}>
                            {entry ? 'Guardar' : 'Marcar aula'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
