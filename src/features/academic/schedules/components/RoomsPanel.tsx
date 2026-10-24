'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { DoorOpen, Edit, Plus, Power, PowerOff, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { Pagination } from '@/shared/components/ui/Pagination/Pagination';
import { useToast } from '@/shared/contexts/ToastContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/utils/api.utils';
import { scheduleService } from '../services/schedule.service';
import { ROOM_TYPE_LABELS, type Room, type RoomType } from '../types/schedule.types';
import evaluation from '@/features/academic/assessments/styles/evaluation.module.css';
import styles from './Schedules.module.css';

interface RoomForm {
    uuid?: string;
    code: string;
    name: string;
    roomType: RoomType;
    capacity: string;
    location: string;
    notes: string;
    isActive: boolean;
}

const EMPTY_FORM: RoomForm = { code: '', name: '', roomType: 'CLASSROOM', capacity: '', location: '', notes: '', isActive: true };

export const RoomsPanel: React.FC<{ canManage: boolean }> = ({ canManage }) => {
    const { showSuccess, showError } = useToast();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const debounced = useDebounce(search.trim(), 400);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<RoomForm | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const [toDelete, setToDelete] = useState<Room | null>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const result = await scheduleService.listRooms({ page, limit, search: debounced || undefined });
            setRooms(result.data);
            setTotal(result.total);
        } catch (error) {
            showError('Erro', getApiErrorMessage(error, 'Não foi possível carregar as salas.'));
        } finally {
            setLoading(false);
        }
    }, [page, limit, debounced]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        setPage(1);
    }, [debounced]);

    const toPayload = (data: RoomForm) => ({
        code: data.code.trim(),
        name: data.name.trim(),
        roomType: data.roomType,
        capacity: data.capacity ? Number(data.capacity) : null,
        location: data.location.trim() || null,
        notes: data.notes.trim() || null,
        isActive: data.isActive,
    });

    const save = async () => {
        if (!form) return;
        const found: Record<string, string> = {};
        if (!form.code.trim()) found.code = 'Indique o código';
        if (form.name.trim().length < 2) found.name = 'Indique o nome';
        if (form.capacity && (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1)) found.capacity = 'Número inteiro maior que 0';
        setErrors(found);
        if (Object.keys(found).length) return;
        try {
            setBusy(true);
            if (form.uuid) await scheduleService.updateRoom(form.uuid, toPayload(form));
            else await scheduleService.createRoom(toPayload(form));
            showSuccess(form.uuid ? 'Sala atualizada' : 'Sala criada', `${form.code} · ${form.name}`);
            setForm(null);
            await load();
        } catch (error) {
            setErrors(getApiFieldErrors(error));
            showError('Não foi possível guardar', getApiErrorMessage(error, 'Tente novamente.'));
        } finally {
            setBusy(false);
        }
    };

    const toggle = async (room: Room) => {
        try {
            await scheduleService.updateRoom(room.uuid, {
                code: room.code,
                name: room.name,
                roomType: room.roomType,
                capacity: room.capacity,
                location: room.location,
                notes: room.notes,
                isActive: !room.isActive,
            });
            showSuccess(room.isActive ? 'Sala desativada' : 'Sala ativada', `${room.code} · ${room.name}`);
            await load();
        } catch (error) {
            showError('Erro', getApiErrorMessage(error, 'Não foi possível alterar a sala.'));
        }
    };

    const remove = async () => {
        if (!toDelete) return;
        try {
            setBusy(true);
            await scheduleService.removeRoom(toDelete.uuid);
            showSuccess('Sala excluída', `${toDelete.code} · ${toDelete.name}`);
            setToDelete(null);
            await load();
        } catch (error) {
            showError('Não foi possível excluir', getApiErrorMessage(error, 'Tente novamente.'));
            setToDelete(null);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className={evaluation.panel}>
            <div className={styles.toolbar}>
                <label className={styles.field}>
                    <span className={styles.fieldLabel}>Pesquisar</span>
                    <span style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 10, top: 12, color: 'var(--text-tertiary)' }} />
                        <input
                            className={styles.input}
                            style={{ paddingLeft: 32, width: '100%' }}
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Código, nome ou localização"
                        />
                    </span>
                </label>
                {canManage && (
                    <Button icon={<Plus size={16} />} onClick={() => setForm({ ...EMPTY_FORM })} className={styles.noPrint}>
                        Nova sala
                    </Button>
                )}
            </div>

            <div style={{ marginTop: 14 }}>
                {loading ? (
                    <p className={styles.muted}>A carregar…</p>
                ) : rooms.length === 0 ? (
                    <div className={evaluation.emptyState}>
                        <DoorOpen size={40} className={evaluation.emptyIcon} />
                        <p className={evaluation.emptyTitle}>{debounced ? 'Nenhuma sala encontrada' : 'Sem salas registadas'}</p>
                        <p>As salas permitem evitar que duas turmas fiquem no mesmo espaço à mesma hora.</p>
                    </div>
                ) : (
                    <div className={evaluation.tableWrapper}>
                        <table className={evaluation.table}>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Nome</th>
                                    <th>Tipo</th>
                                    <th>Capacidade</th>
                                    <th>Localização</th>
                                    <th>Estado</th>
                                    {canManage && <th style={{ textAlign: 'right' }}>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map(room => (
                                    <tr key={room.uuid}>
                                        <td>
                                            <strong>{room.code}</strong>
                                        </td>
                                        <td>{room.name}</td>
                                        <td>{ROOM_TYPE_LABELS[room.roomType] ?? room.roomType}</td>
                                        <td className={evaluation.numeric}>{room.capacity ?? '—'}</td>
                                        <td>{room.location || '—'}</td>
                                        <td>
                                            <Badge variant={room.isActive ? 'success' : 'neutral'} size="sm">
                                                {room.isActive ? 'Ativa' : 'Inativa'}
                                            </Badge>
                                        </td>
                                        {canManage && (
                                            <td>
                                                <div className={evaluation.rowActions} style={{ justifyContent: 'flex-end' }}>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        icon={<Edit size={14} />}
                                                        onClick={() =>
                                                            setForm({
                                                                uuid: room.uuid,
                                                                code: room.code,
                                                                name: room.name,
                                                                roomType: room.roomType,
                                                                capacity: room.capacity ? String(room.capacity) : '',
                                                                location: room.location ?? '',
                                                                notes: room.notes ?? '',
                                                                isActive: room.isActive,
                                                            })
                                                        }
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        icon={room.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                                                        onClick={() => toggle(room)}
                                                    >
                                                        {room.isActive ? 'Desativar' : 'Ativar'}
                                                    </Button>
                                                    <Button size="sm" variant="outline" icon={<Trash2 size={14} />} onClick={() => setToDelete(room)} aria-label="Excluir" />
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {total > 0 && (
                    <Pagination
                        page={page}
                        totalPages={Math.max(1, Math.ceil(total / limit))}
                        total={total}
                        limit={limit}
                        onPageChange={setPage}
                        onLimitChange={value => {
                            setLimit(value);
                            setPage(1);
                        }}
                        itemLabel="salas"
                        disabled={loading}
                    />
                )}
            </div>

            {form && (
                <Modal isOpen onClose={() => setForm(null)} title={form.uuid ? 'Editar sala' : 'Nova sala'} size="md">
                    <div className={styles.dialogBody}>
                        <div className={styles.formGrid}>
                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Código *</span>
                                <input className={styles.input} value={form.code} maxLength={20} placeholder="Ex.: S01" onChange={event => setForm({ ...form, code: event.target.value })} />
                                {errors.code && <span className={styles.errorText}>{errors.code}</span>}
                            </label>
                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Tipo</span>
                                <select className={styles.nativeSelect} value={form.roomType} onChange={event => setForm({ ...form, roomType: event.target.value as RoomType })}>
                                    {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className={`${styles.field} ${styles.fullRow}`} style={{ maxWidth: 'none' }}>
                                <span className={styles.fieldLabel}>Nome *</span>
                                <input className={styles.input} value={form.name} maxLength={100} placeholder="Ex.: Sala 1 – Bloco A" onChange={event => setForm({ ...form, name: event.target.value })} />
                                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                            </label>
                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Capacidade (lugares)</span>
                                <input className={styles.input} type="number" min={1} value={form.capacity} onChange={event => setForm({ ...form, capacity: event.target.value })} />
                                {errors.capacity && <span className={styles.errorText}>{errors.capacity}</span>}
                            </label>
                            <label className={styles.field}>
                                <span className={styles.fieldLabel}>Localização</span>
                                <input className={styles.input} value={form.location} maxLength={150} placeholder="Ex.: Bloco A, 1.º piso" onChange={event => setForm({ ...form, location: event.target.value })} />
                            </label>
                            <label className={`${styles.field} ${styles.fullRow}`} style={{ maxWidth: 'none' }}>
                                <span className={styles.fieldLabel}>Observações</span>
                                <input className={styles.input} value={form.notes} maxLength={1000} onChange={event => setForm({ ...form, notes: event.target.value })} />
                            </label>
                        </div>
                        <div className={styles.dialogActions}>
                            <div className={styles.dialogActionsRight}>
                                <Button variant="secondary" onClick={() => setForm(null)} disabled={busy}>
                                    Cancelar
                                </Button>
                                <Button onClick={save} isLoading={busy}>
                                    Guardar
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
                title="Excluir sala"
                message={`Excluir a sala "${toDelete?.code} · ${toDelete?.name}"? Se já tiver aulas no horário, desative-a em vez de excluir.`}
                type="danger"
                confirmText="Excluir"
                isLoading={busy}
            />
        </div>
    );
};
