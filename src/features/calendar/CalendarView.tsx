'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Download, MapPin, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { useToast } from '@/shared/contexts/ToastContext';
import { getApiErrorMessage, getApiFieldErrors } from '@/shared/utils/api.utils';
import { classService } from '@/features/academic/classes/services/class.service';
import {
    AUDIENCE_LABELS,
    calendarService,
    EVENT_TYPE_COLORS,
    EVENT_TYPE_LABELS,
    type Audience,
    type CalendarEvent,
    type EventType,
} from './calendar.service';
import schedules from '@/features/academic/schedules/components/Schedules.module.css';
import styles from './calendar.module.css';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (value: string) => new Date(`${value}T12:00:00`);

// Grelha de 6 semanas a começar na segunda-feira
function monthGrid(year: number, month: number): Date[] {
    const first = new Date(year, month, 1, 12);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - offset, 12);
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12));
}

function whenText(event: CalendarEvent): string {
    const start = parse(event.startDate);
    const end = parse(event.endDate);
    const fmt = (d: Date) => d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' });
    const dates = event.startDate === event.endDate ? fmt(start) : `${fmt(start)} – ${fmt(end)}`;
    return event.allDay ? dates : `${dates}, ${event.startTime}${event.endTime ? `–${event.endTime}` : ''}`;
}

interface CalendarViewProps {
    source: 'school' | 'teacher' | 'student';
    canManage?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ source, canManage = false }) => {
    const { showSuccess, showError } = useToast();
    const now = new Date();
    const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [typeFilter, setTypeFilter] = useState<EventType | ''>('');
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<CalendarEvent | null>(null);
    const [form, setForm] = useState<Partial<CalendarEvent> | null>(null);
    const [importing, setImporting] = useState(false);

    const days = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
    const from = iso(days[0]);
    const to = iso(days[days.length - 1]);

    const load = useCallback(async () => {
        try {
            setError(null);
            setEvents(await calendarService.events(from, to, source));
        } catch (err) {
            setError(getApiErrorMessage(err, 'Não foi possível carregar o calendário.'));
        }
    }, [from, to, source]);

    useEffect(() => {
        load();
    }, [load]);

    const visible = events.filter(event => !typeFilter || event.eventType === typeFilter);
    const eventsOn = (day: string) => visible.filter(event => event.startDate <= day && event.endDate >= day);
    const monthStart = iso(new Date(cursor.year, cursor.month, 1, 12));
    const monthEnd = iso(new Date(cursor.year, cursor.month + 1, 0, 12));
    const monthEvents = visible.filter(event => event.startDate <= monthEnd && event.endDate >= monthStart);
    const todayIso = iso(now);
    const title = new Date(cursor.year, cursor.month, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

    const move = (delta: number) =>
        setCursor(prev => {
            const date = new Date(prev.year, prev.month + delta, 1);
            return { year: date.getFullYear(), month: date.getMonth() };
        });

    const importHolidays = async () => {
        try {
            setImporting(true);
            const result = await calendarService.importHolidays(cursor.year);
            showSuccess('Feriados nacionais', result.created ? `${result.created} feriado(s) de ${cursor.year} adicionados.` : `Os feriados de ${cursor.year} já estavam no calendário.`);
            load();
        } catch (err) {
            showError('Não foi possível importar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setImporting(false);
        }
    };

    const openEvent = (event: CalendarEvent) => {
        if (canManage && !event.virtual) setForm(event);
        else setSelected(event);
    };

    return (
        <>
            <div className={schedules.toolbar} style={{ marginBottom: 12 }}>
                <label className={schedules.field} style={{ maxWidth: 220 }}>
                    <span className={schedules.fieldLabel}>Tipo</span>
                    <select className={schedules.nativeSelect} value={typeFilter} onChange={event => setTypeFilter(event.target.value as EventType | '')}>
                        <option value="">Todos</option>
                        {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>
                {canManage && (
                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
                        <Button variant="outline" icon={<Download size={16} />} onClick={importHolidays} isLoading={importing}>
                            Feriados nacionais {cursor.year}
                        </Button>
                        <Button icon={<Plus size={16} />} onClick={() => setForm({ startDate: todayIso, endDate: todayIso, allDay: true, eventType: 'EVENT', audience: 'ALL', isDayOff: false })}>
                            Novo evento
                        </Button>
                    </div>
                )}
            </div>

            {error && <p className={schedules.errorText}>{error}</p>}

            <div className={styles.layout}>
                <div>
                    <div className={styles.monthHead}>
                        <span className={styles.monthTitle}>{title}</span>
                        <div className={styles.navButtons}>
                            <button type="button" className={styles.iconButton} onClick={() => move(-1)} aria-label="Mês anterior">
                                <ChevronLeft size={18} />
                            </button>
                            <Button variant="secondary" size="sm" onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() })}>
                                Hoje
                            </Button>
                            <button type="button" className={styles.iconButton} onClick={() => move(1)} aria-label="Mês seguinte">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.grid} role="grid" aria-label={`Calendário de ${title}`}>
                        {WEEKDAYS.map(day => (
                            <div key={day} className={styles.weekday} role="columnheader">
                                {day}
                            </div>
                        ))}
                        {days.map(day => {
                            const key = iso(day);
                            const list = eventsOn(key);
                            const outside = day.getMonth() !== cursor.month;
                            const off = list.some(event => event.isDayOff);
                            const className = `${styles.day} ${outside ? styles.outside : ''} ${off ? styles.dayOff : ''} ${key === todayIso ? styles.today : ''}`;
                            const content = (
                                <>
                                    <span className={styles.dayNumber}>{day.getDate()}</span>
                                    {list.slice(0, 3).map(event => (
                                        <span
                                            key={event.uuid}
                                            role="button"
                                            tabIndex={0}
                                            className={styles.chip}
                                            style={{ ['--tone' as string]: EVENT_TYPE_COLORS[event.eventType] }}
                                            title={event.title}
                                            onClick={e => {
                                                e.stopPropagation();
                                                openEvent(event);
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.stopPropagation();
                                                    openEvent(event);
                                                }
                                            }}
                                        >
                                            {event.title}
                                        </span>
                                    ))}
                                    {list.length > 3 && <span className={styles.more}>+{list.length - 3}</span>}
                                </>
                            );
                            return canManage ? (
                                <button
                                    key={key}
                                    type="button"
                                    className={className}
                                    onClick={() => setForm({ startDate: key, endDate: key, allDay: true, eventType: 'EVENT', audience: 'ALL', isDayOff: false })}
                                    aria-label={`Novo evento a ${day.toLocaleDateString('pt-PT')}`}
                                >
                                    {content}
                                </button>
                            ) : (
                                <div key={key} className={className} role="gridcell">
                                    {content}
                                </div>
                            );
                        })}
                    </div>
                    <div className={styles.legend}>
                        {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).filter(type => type !== 'TERM_END').map(type => (
                            <span key={type}>
                                <span className={styles.legendDot} style={{ background: EVENT_TYPE_COLORS[type] }} />
                                {type === 'TERM_START' ? 'Início/fim de período' : EVENT_TYPE_LABELS[type]}
                            </span>
                        ))}
                    </div>
                </div>

                <aside>
                    <p className={schedules.fieldLabel} style={{ marginBottom: 8 }}>
                        Eventos de {title}
                    </p>
                    {monthEvents.length === 0 ? (
                        <p className={schedules.muted}>Sem eventos neste mês.</p>
                    ) : (
                        <div className={styles.list}>
                            {monthEvents.map(event => {
                                const start = parse(event.startDate);
                                return (
                                    <button key={event.uuid} type="button" className={styles.item} style={{ ['--tone' as string]: EVENT_TYPE_COLORS[event.eventType] }} onClick={() => openEvent(event)}>
                                        <span className={styles.itemDate}>
                                            <span className={styles.itemDay}>{start.getDate()}</span>
                                            <span className={styles.itemMonth}>{MONTHS[start.getMonth()]}</span>
                                        </span>
                                        <span>
                                            <span className={styles.itemTitle}>{event.title}</span>
                                            <br />
                                            <span className={styles.itemMeta}>
                                                {EVENT_TYPE_LABELS[event.eventType]}
                                                {event.isDayOff ? ' · sem aulas' : ''}
                                                {event.class ? ` · ${event.class.gradeName} ${event.class.name}` : ''}
                                                {!event.allDay && event.startTime ? ` · ${event.startTime}` : ''}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </aside>
            </div>

            {selected && (
                <Modal isOpen onClose={() => setSelected(null)} title={selected.title} size="md">
                    <div className={schedules.dialogBody}>
                        <div className={schedules.when}>
                            <CalendarDays size={18} />
                            <span>{whenText(selected)}</span>
                        </div>
                        <p className={schedules.muted}>
                            {EVENT_TYPE_LABELS[selected.eventType]} · {AUDIENCE_LABELS[selected.audience]}
                            {selected.class ? ` · ${selected.class.gradeName} · Turma ${selected.class.name}` : ''}
                            {selected.isDayOff ? ' · não há aulas' : ''}
                        </p>
                        {selected.location && (
                            <p className={schedules.muted}>
                                <MapPin size={14} style={{ verticalAlign: '-2px' }} /> {selected.location}
                            </p>
                        )}
                        {selected.description && <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{selected.description}</p>}
                    </div>
                </Modal>
            )}

            {form && (
                <EventDialog
                    initial={form}
                    onClose={() => setForm(null)}
                    onSaved={() => {
                        setForm(null);
                        load();
                    }}
                />
            )}
        </>
    );
};

const EventDialog: React.FC<{ initial: Partial<CalendarEvent>; onClose: () => void; onSaved: () => void }> = ({ initial, onClose, onSaved }) => {
    const { showSuccess, showError } = useToast();
    const [title, setTitle] = useState(initial.title ?? '');
    const [eventType, setEventType] = useState<EventType>(initial.eventType ?? 'EVENT');
    const [startDate, setStartDate] = useState(initial.startDate ?? '');
    const [endDate, setEndDate] = useState(initial.endDate ?? initial.startDate ?? '');
    const [allDay, setAllDay] = useState(initial.allDay ?? true);
    const [startTime, setStartTime] = useState(initial.startTime ?? '');
    const [endTime, setEndTime] = useState(initial.endTime ?? '');
    const [location, setLocation] = useState(initial.location ?? '');
    const [audience, setAudience] = useState<Audience>(initial.audience ?? 'ALL');
    const [classUuid, setClassUuid] = useState(initial.class?.uuid ?? '');
    const [isDayOff, setIsDayOff] = useState(initial.isDayOff ?? false);
    const [description, setDescription] = useState(initial.description ?? '');
    const [classes, setClasses] = useState<{ uuid: string; name: string }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        classService
            .getAll({ limit: 100 })
            .then(result =>
                setClasses(
                    (result.data as unknown as { uuid: string; name: string; gradeName: string; academicYearName: string }[]).map(item => ({
                        uuid: item.uuid,
                        name: `${item.gradeName} · Turma ${item.name} (${item.academicYearName})`,
                    }))
                )
            )
            .catch(() => setClasses([]));
    }, []);

    const save = async () => {
        const found: Record<string, string> = {};
        if (title.trim().length < 2) found.title = 'Indique o título';
        if (!startDate) found.startDate = 'Indique a data';
        if (endDate && endDate < startDate) found.endDate = 'Não pode ser antes do início';
        if (!allDay && !startTime) found.startTime = 'Indique a hora';
        setErrors(found);
        if (Object.keys(found).length) return;
        try {
            setSaving(true);
            const payload = {
                title: title.trim(),
                description: description.trim() || null,
                eventType,
                startDate,
                endDate: endDate || startDate,
                allDay,
                startTime: allDay ? null : startTime,
                endTime: allDay ? null : endTime || null,
                location: location.trim() || null,
                audience,
                classUuid: classUuid || null,
                isDayOff: eventType === 'HOLIDAY' ? true : isDayOff,
            };
            if (initial.uuid) await calendarService.update(initial.uuid, payload);
            else await calendarService.create(payload);
            showSuccess(initial.uuid ? 'Evento atualizado' : 'Evento criado', title);
            onSaved();
        } catch (err) {
            setErrors(getApiFieldErrors(err));
            showError('Não foi possível guardar', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!initial.uuid) return;
        try {
            setSaving(true);
            await calendarService.remove(initial.uuid);
            showSuccess('Evento removido', title);
            onSaved();
        } catch (err) {
            showError('Não foi possível remover', getApiErrorMessage(err, 'Tente novamente.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={initial.uuid ? 'Editar evento' : 'Novo evento'} size="lg">
            <div className={schedules.dialogBody}>
                <div className={schedules.formGrid}>
                    <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Título *</span>
                        <input className={schedules.input} value={title} maxLength={150} onChange={event => setTitle(event.target.value)} placeholder="Ex.: Provas trimestrais de Matemática" />
                        {errors.title && <span className={schedules.errorText}>{errors.title}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Tipo</span>
                        <select className={schedules.nativeSelect} value={eventType} onChange={event => setEventType(event.target.value as EventType)}>
                            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Para quem</span>
                        <select className={schedules.nativeSelect} value={audience} onChange={event => setAudience(event.target.value as Audience)}>
                            {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Início *</span>
                        <input type="date" className={schedules.input} value={startDate} onChange={event => setStartDate(event.target.value)} />
                        {errors.startDate && <span className={schedules.errorText}>{errors.startDate}</span>}
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Fim</span>
                        <input type="date" className={schedules.input} value={endDate} min={startDate} onChange={event => setEndDate(event.target.value)} />
                        {errors.endDate && <span className={schedules.errorText}>{errors.endDate}</span>}
                    </label>
                    <label className={`${schedules.checkboxRow} ${schedules.fullRow}`}>
                        <input type="checkbox" checked={allDay} onChange={event => setAllDay(event.target.checked)} />
                        Todo o dia
                    </label>
                    {!allDay && (
                        <>
                            <label className={schedules.field}>
                                <span className={schedules.fieldLabel}>Hora de início *</span>
                                <input type="time" className={schedules.input} value={startTime} onChange={event => setStartTime(event.target.value)} />
                                {errors.startTime && <span className={schedules.errorText}>{errors.startTime}</span>}
                            </label>
                            <label className={schedules.field}>
                                <span className={schedules.fieldLabel}>Hora de fim</span>
                                <input type="time" className={schedules.input} value={endTime} onChange={event => setEndTime(event.target.value)} />
                                {errors.endTime && <span className={schedules.errorText}>{errors.endTime}</span>}
                            </label>
                        </>
                    )}
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Turma (opcional)</span>
                        <select className={schedules.nativeSelect} value={classUuid} onChange={event => setClassUuid(event.target.value)}>
                            <option value="">Toda a escola</option>
                            {classes.map(item => (
                                <option key={item.uuid} value={item.uuid}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={schedules.field}>
                        <span className={schedules.fieldLabel}>Local</span>
                        <input className={schedules.input} value={location} maxLength={150} onChange={event => setLocation(event.target.value)} />
                    </label>
                    <label className={`${schedules.checkboxRow} ${schedules.fullRow}`}>
                        <input type="checkbox" checked={eventType === 'HOLIDAY' || isDayOff} disabled={eventType === 'HOLIDAY'} onChange={event => setIsDayOff(event.target.checked)} />
                        Não há aulas neste(s) dia(s) — a chamada fica bloqueada
                    </label>
                    <label className={`${schedules.field} ${schedules.fullRow}`} style={{ maxWidth: 'none' }}>
                        <span className={schedules.fieldLabel}>Descrição</span>
                        <textarea className={schedules.input} style={{ height: 80, paddingTop: 8 }} value={description} maxLength={2000} onChange={event => setDescription(event.target.value)} />
                    </label>
                </div>
                <div className={schedules.dialogActions}>
                    {initial.uuid &&
                        (confirmDelete ? (
                            <Button variant="danger" icon={<Trash2 size={16} />} onClick={remove} isLoading={saving}>
                                Confirmar remoção
                            </Button>
                        ) : (
                            <Button variant="outline" icon={<Trash2 size={16} />} onClick={() => setConfirmDelete(true)} disabled={saving}>
                                Remover
                            </Button>
                        ))}
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
