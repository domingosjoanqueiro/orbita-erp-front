// src/app/(dashboard)/attendance/page.tsx

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CalendarCheck,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    Clock,
    Info,
    Save,
    ShieldCheck,
    UserCheck,
    UserX,
    Users,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { usePermission } from '@/shared/hooks/usePermission';
import { useAuth } from '@/shared/contexts/AuthContext';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { assessmentService } from '@/features/academic/assessments/services/assessment.service';
import { preselectedAssignment } from '@/features/academic/assessments/components/ScoreEntryPanel';
import { AssignmentPicker, StudentCell, SummaryTile } from '@/features/academic/assessments/components/EvaluationUI';
import type { TeacherAssignmentOption } from '@/features/academic/assessments/types/assessment.types';
import { attendanceService } from '@/features/academic/attendance/services/attendance.service';
import {
    ATTENDANCE_STATUS_LABELS,
    type AttendanceSheet,
    type AttendanceStatus,
} from '@/features/academic/attendance/types/attendance.types';
import styles from '@/features/academic/assessments/styles/evaluation.module.css';

const STATUSES = Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[];

// Rótulos curtos e cor de cada estado nos botões
const STATUS_BUTTON: Record<AttendanceStatus, { short: string; className: string }> = {
    PRESENT: { short: 'Presente', className: styles.segPresent },
    ABSENT: { short: 'Falta', className: styles.segAbsent },
    LATE: { short: 'Atraso', className: styles.segLate },
    EXCUSED: { short: 'Justificada', className: styles.segExcused },
};

type Draft = Record<string, { status: AttendanceStatus | null; remarks: string }>;

const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Data local no formato YYYY-MM-DD
const today = () => toIso(new Date());

const shiftDate = (iso: string, days: number) => {
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() + days);
    return toIso(d);
};

const longDate = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

export default function AttendancePage() {
    const { showSuccess, showError, showWarning } = useToast();
    const { startLoading, stopLoading } = useLoading();
    const { hasPermission } = usePermission();
    const canRead = hasPermission('attendance.read');
    const canRecord = hasPermission('attendance.create');
    const { user } = useAuth();
    const isTeacher = !!user?.teacher;

    const [assignments, setAssignments] = useState<TeacherAssignmentOption[]>([]);
    const [assignmentUuid, setAssignmentUuid] = useState('');
    const [date, setDate] = useState(today());
    const [sheet, setSheet] = useState<AttendanceSheet | null>(null);
    const [draft, setDraft] = useState<Draft>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!canRead) return;
        assessmentService
            .getTeacherAssignments(isTeacher)
            .then(list => {
                setAssignments(list);
                const preselected = preselectedAssignment();
                if (preselected && list.some(a => a.uuid === preselected)) setAssignmentUuid(preselected);
            })
            .catch(err => showError('Erro', getApiErrorMessage(err, 'Não foi possível carregar as atribuições')));
    }, [canRead, isTeacher]);

    const loadSheet = async () => {
        if (!assignmentUuid || !date) {
            setSheet(null);
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            const data = await attendanceService.getSheet(assignmentUuid, date);
            setSheet(data);
            setDraft(
                Object.fromEntries(
                    data.students.map(s => [s.studentUuid, { status: s.status, remarks: s.remarks ?? '' }])
                )
            );
        } catch (err) {
            setSheet(null);
            setError(getApiErrorMessage(err, 'Não foi possível carregar a folha de presenças'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSheet();
    }, [assignmentUuid, date]);

    const summary = useMemo(() => {
        const counts: Record<AttendanceStatus, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
        let missing = 0;
        Object.values(draft).forEach(row => {
            if (row.status) counts[row.status]++;
            else missing++;
        });
        const total = Object.keys(draft).length;
        return { counts, missing, total, marked: total - missing };
    }, [draft]);

    const isDirty = useMemo(() => {
        if (!sheet) return false;
        return sheet.students.some(s => {
            const row = draft[s.studentUuid];
            return !!row && (row.status !== s.status || row.remarks.trim() !== (s.remarks ?? ''));
        });
    }, [sheet, draft]);

    const setStatus = (studentUuid: string, status: AttendanceStatus) =>
        setDraft(prev => ({ ...prev, [studentUuid]: { ...prev[studentUuid], status } }));

    const markAllPresent = () =>
        setDraft(prev =>
            Object.fromEntries(
                Object.entries(prev).map(([uuid, row]) => [uuid, { ...row, status: row.status ?? 'PRESENT' }])
            )
        );

    const handleSave = async () => {
        const entries = Object.entries(draft)
            .filter(([, row]) => row.status !== null)
            .map(([studentUuid, row]) => ({
                studentUuid,
                status: row.status as AttendanceStatus,
                remarks: row.remarks.trim() || undefined,
            }));
        if (entries.length === 0) {
            showWarning('Sem registos', 'Marque a presença de pelo menos um aluno.');
            return;
        }
        try {
            setIsSaving(true);
            startLoading();
            const result = await attendanceService.saveSheet({ teacherAssignmentUuid: assignmentUuid, attendanceDate: date, entries });
            showSuccess('Presenças guardadas', result.message);
            await loadSheet();
        } catch (err) {
            showError('Erro', getApiErrorMessage(err, 'Não foi possível guardar as presenças'));
        } finally {
            setIsSaving(false);
            stopLoading();
        }
    };

    const isToday = date === today();
    const attendanceRate = summary.marked
        ? Math.round(((summary.counts.PRESENT + summary.counts.LATE) / summary.marked) * 100)
        : null;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.headerIcon}>
                        <CalendarCheck size={26} />
                    </div>
                    <div>
                        <h1 className={styles.title}>Presenças</h1>
                        <p className={styles.subtitle}>Chamada diária por turma e disciplina</p>
                    </div>
                </div>
                {sheet && (
                    <div className={styles.headerStats}>
                        <div className={styles.headerStat}>
                            <span className={styles.headerStatValue}>{summary.marked}/{summary.total}</span>
                            <span className={styles.headerStatLabel}>Marcados</span>
                        </div>
                        <div className={styles.headerStat}>
                            <span className={styles.headerStatValue}>{attendanceRate === null ? '—' : `${attendanceRate}%`}</span>
                            <span className={styles.headerStatLabel}>Assiduidade</span>
                        </div>
                    </div>
                )}
            </div>

            {!canRead ? (
                <div className={styles.panel}>
                    <div className={styles.emptyState}>
                        <CalendarCheck size={44} className={styles.emptyIcon} />
                        <p className={styles.emptyTitle}>Sem acesso</p>
                        <p>Não tem permissão para consultar presenças.</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.panel}>
                        <h2 className={styles.panelTitle}>
                            <Users size={18} />
                            {isTeacher ? 'Escolha a turma e a disciplina' : 'Atribuição'}
                        </h2>
                        <AssignmentPicker
                            assignments={assignments}
                            value={assignmentUuid}
                            onChange={setAssignmentUuid}
                            showTeacher={!isTeacher}
                            emptyLabel={isTeacher ? 'Não tem turmas atribuídas.' : 'Sem atribuições ativas.'}
                        />

                        <div style={{ marginTop: 'var(--spacing-md)' }}>
                            <span className={styles.fieldLabel}>Data da aula</span>
                            <div className={styles.dateNav}>
                                <button type="button" className={styles.iconButton} onClick={() => setDate(d => shiftDate(d, -1))} aria-label="Dia anterior">
                                    <ChevronLeft size={18} />
                                </button>
                                <input
                                    type="date"
                                    className={styles.dateInput}
                                    value={date}
                                    max={today()}
                                    onChange={e => e.target.value && setDate(e.target.value)}
                                    aria-label="Data da aula"
                                />
                                <button
                                    type="button"
                                    className={styles.iconButton}
                                    onClick={() => setDate(d => shiftDate(d, 1))}
                                    disabled={isToday || date > today()}
                                    aria-label="Dia seguinte"
                                >
                                    <ChevronRight size={18} />
                                </button>
                                {!isToday && (
                                    <button type="button" className={styles.todayButton} onClick={() => setDate(today())}>
                                        Hoje
                                    </button>
                                )}
                                <span className={styles.hint} style={{ marginLeft: 'var(--spacing-sm)', textTransform: 'capitalize' }}>
                                    {longDate(date)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className={`${styles.banner} ${styles.bannerWarning}`}>
                            <AlertTriangle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {!assignmentUuid && (
                        <div className={styles.panel}>
                            <div className={styles.emptyState}>
                                <CalendarCheck size={44} className={styles.emptyIcon} />
                                <p className={styles.emptyTitle}>Selecione a turma e a disciplina</p>
                                <p>Depois escolha a data para fazer a chamada.</p>
                            </div>
                        </div>
                    )}

                    {isLoading && <p className={styles.loadingText}>A carregar alunos...</p>}

                    {!isLoading && sheet && (
                        <div className={styles.panel}>
                            <div className={styles.actionsBar} style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}>
                                <h2 className={styles.panelTitle} style={{ margin: 0 }}>
                                    {sheet.teacherAssignment.subjectName} — Turma {sheet.teacherAssignment.className}
                                </h2>
                                <span className={`${styles.banner} ${sheet.isRecorded ? styles.bannerSuccess : styles.bannerWarning}`} style={{ margin: 0, padding: '4px 12px' }}>
                                    {sheet.isRecorded ? <ShieldCheck size={16} /> : <Clock size={16} />}
                                    {sheet.isRecorded ? 'Chamada registada' : 'Chamada por registar'}
                                </span>
                            </div>

                            <div className={styles.summaryGrid}>
                                <SummaryTile tone="green" icon={<UserCheck size={18} />} value={summary.counts.PRESENT} label="Presentes" />
                                <SummaryTile tone="red" icon={<UserX size={18} />} value={summary.counts.ABSENT} label="Faltas" />
                                <SummaryTile tone="amber" icon={<Clock size={18} />} value={summary.counts.LATE} label="Atrasos" />
                                <SummaryTile tone="blue" icon={<ShieldCheck size={18} />} value={summary.counts.EXCUSED} label="Justificadas" />
                                <SummaryTile tone="purple" icon={<Users size={18} />} value={summary.missing} label="Por marcar" />
                            </div>

                            {!canRecord && (
                                <div className={`${styles.banner} ${styles.bannerInfo}`}>
                                    <Info size={18} />
                                    <span>Não tem permissão para registar presenças; a folha está em modo de consulta.</span>
                                </div>
                            )}

                            {sheet.students.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p className={styles.emptyTitle}>Sem alunos matriculados</p>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: 48 }}>#</th>
                                                    <th>Aluno</th>
                                                    <th>Estado</th>
                                                    <th>Observações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sheet.students.map((student, index) => {
                                                    const row = draft[student.studentUuid] ?? { status: null, remarks: '' };
                                                    return (
                                                        <tr key={student.studentUuid}>
                                                            <td className={styles.muted}>{index + 1}</td>
                                                            <td>
                                                                <StudentCell uuid={student.studentUuid} name={student.studentName} number={student.studentNumber} />
                                                            </td>
                                                            <td>
                                                                <div className={styles.segmented} role="radiogroup" aria-label={`Estado de ${student.studentName}`}>
                                                                    {STATUSES.map(status => (
                                                                        <button
                                                                            key={status}
                                                                            type="button"
                                                                            role="radio"
                                                                            aria-checked={row.status === status}
                                                                            title={ATTENDANCE_STATUS_LABELS[status]}
                                                                            className={`${styles.segButton} ${STATUS_BUTTON[status].className} ${row.status === status ? styles.active : ''}`}
                                                                            disabled={!canRecord || isSaving}
                                                                            onClick={() => setStatus(student.studentUuid, status)}
                                                                        >
                                                                            {STATUS_BUTTON[status].short}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <input
                                                                    className={styles.remarksInput}
                                                                    value={row.remarks}
                                                                    maxLength={1000}
                                                                    placeholder="Opcional"
                                                                    disabled={!canRecord || isSaving}
                                                                    aria-label={`Observações de ${student.studentName}`}
                                                                    onChange={e =>
                                                                        setDraft(prev => ({
                                                                            ...prev,
                                                                            [student.studentUuid]: { ...row, remarks: e.target.value },
                                                                        }))
                                                                    }
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {canRecord && (
                                        <div className={`${styles.stickyBar} ${isDirty ? styles.dirty : ''}`}>
                                            <span className={styles.hint}>
                                                {isDirty ? 'Tem alterações por guardar.' : `${summary.marked} de ${summary.total} alunos marcados.`}
                                            </span>
                                            <div className={styles.actionsGroup}>
                                                <Button
                                                    variant="secondary"
                                                    icon={<CheckCheck size={16} />}
                                                    onClick={markAllPresent}
                                                    disabled={isSaving || summary.missing === 0}
                                                >
                                                    Restantes presentes
                                                </Button>
                                                <Button icon={<Save size={16} />} onClick={handleSave} isLoading={isSaving} disabled={isSaving || !isDirty}>
                                                    Guardar presenças
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
