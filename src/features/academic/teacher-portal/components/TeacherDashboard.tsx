// src/features/academic/teacher-portal/components/TeacherDashboard.tsx
// Painel inicial do professor: turmas, presenças de hoje, estado das notas e atalhos.

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    CalendarCheck,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    School,
    Star,
    Users,
} from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { assessmentService } from '@/features/academic/assessments/services/assessment.service';
import {
    SUBMISSION_STATUS_LABELS,
    type AssessmentPeriodState,
    type SubmissionStatus,
    type TeacherAssignmentOption,
} from '@/features/academic/assessments/types/assessment.types';
import { attendanceService } from '@/features/academic/attendance/services/attendance.service';
import styles from './TeacherDashboard.module.css';

interface AssignmentOverview {
    assignment: TeacherAssignmentOption;
    periods: AssessmentPeriodState[] | null;
    attendanceToday: boolean | null;
}

// Data local no formato YYYY-MM-DD
const todayIso = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const statusClass = (status: SubmissionStatus | null) => {
    switch (status) {
        case 'PUBLISHED': return styles.sDone;
        case 'VALIDATED': return styles.sInfo;
        case 'SUBMITTED': return styles.sPurple;
        case 'RETURNED': return styles.sDanger;
        default: return styles.sNeutral;
    }
};

const initials = (name: string) =>
    name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('') || 'P';

export const TeacherDashboard: React.FC = () => {
    const { user } = useAuth();
    const { showError } = useToast();
    const [overview, setOverview] = useState<AssignmentOverview[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const assignments = await assessmentService.getTeacherAssignments(true);
                const today = todayIso();
                // Estado por atribuição; uma falha isolada não impede o resto do painel
                const items = await Promise.all(
                    assignments.map(async assignment => {
                        const [context, sheet] = await Promise.all([
                            assessmentService.getContext(assignment.uuid).catch(() => null),
                            attendanceService.getSheet(assignment.uuid, today).catch(() => null),
                        ]);
                        return {
                            assignment,
                            periods: context?.periods ?? null,
                            attendanceToday: sheet ? sheet.isRecorded : null,
                        };
                    })
                );
                setOverview(items);
            } catch (err) {
                showError('Erro', getApiErrorMessage(err, 'Não foi possível carregar o seu painel'));
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const classIndex = useMemo(() => {
        const map = new Map<string, number>();
        overview.forEach(o => {
            if (!map.has(o.assignment.classUuid)) map.set(o.assignment.classUuid, map.size);
        });
        return map;
    }, [overview]);

    const stats = useMemo(() => {
        const classes = new Map<string, number>();
        overview.forEach(o => classes.set(o.assignment.classUuid, o.assignment.studentsCount ?? 0));
        const withAttendance = overview.filter(o => o.attendanceToday !== null);
        return {
            classes: classes.size,
            subjects: overview.length,
            students: Array.from(classes.values()).reduce((sum, n) => sum + n, 0),
            attendanceDone: withAttendance.filter(o => o.attendanceToday).length,
            attendanceTotal: withAttendance.length,
        };
    }, [overview]);

    const returned = useMemo(
        () => overview.flatMap(o =>
            (o.periods ?? [])
                .filter(p => p.status === 'RETURNED')
                .map(p => ({ assignment: o.assignment, period: p }))
        ),
        [overview]
    );

    const name = user?.teacher?.fullName ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const dateLabel = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const attendancePercent = stats.attendanceTotal ? Math.round((stats.attendanceDone / stats.attendanceTotal) * 100) : 0;

    const classBadge = (a: TeacherAssignmentOption) => (
        <span className={`${styles.classBadge} ${styles[`band${(classIndex.get(a.classUuid) ?? 0) % 6}`]}`}>
            <span className={styles.classBadgeSmall}>{a.gradeName.replace(/\s*Classe/i, '')}</span>
            {a.className}
        </span>
    );

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroMain}>
                    <span className={styles.heroAvatar}>{initials(name)}</span>
                    <div>
                        <p className={styles.heroDate}>{dateLabel}</p>
                        <h1 className={styles.heroTitle}>{greeting}, {name.split(' ')[0]}!</h1>
                        <p className={styles.heroSubtitle}>
                            <span className={styles.heroPill}>{user?.teacher?.teacherNumber}</span>
                            <span>{user?.company?.name}</span>
                        </p>
                    </div>
                </div>
                <div className={styles.heroStats}>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatValue}>{isLoading ? '—' : stats.classes}</span>
                        <span className={styles.heroStatLabel}><School size={12} /> Turmas</span>
                    </div>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatValue}>{isLoading ? '—' : stats.subjects}</span>
                        <span className={styles.heroStatLabel}><BookOpen size={12} /> Disciplinas</span>
                    </div>
                    <div className={styles.heroStat}>
                        <span className={styles.heroStatValue}>{isLoading ? '—' : stats.students}</span>
                        <span className={styles.heroStatLabel}><Users size={12} /> Alunos</span>
                    </div>
                </div>
            </section>

            {/* Notas devolvidas */}
            {returned.length > 0 && (
                <div className={styles.alert} role="alert">
                    <span className={styles.alertIcon}><AlertTriangle size={20} /></span>
                    <div>
                        <p className={styles.alertTitle}>
                            {returned.length === 1 ? 'Há notas devolvidas para corrigir' : `Há ${returned.length} períodos com notas devolvidas`}
                        </p>
                        <ul className={styles.alertList}>
                            {returned.map(({ assignment, period }) => (
                                <li key={`${assignment.uuid}-${period.academicPeriod}`}>
                                    <Link href={`/academic/assessments?assignment=${assignment.uuid}`}>
                                        {assignment.subjectName} · {assignment.gradeName} {assignment.className} · {period.displayName}
                                    </Link>
                                    {period.returnedReason ? ` — "${period.returnedReason}"` : ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Atalhos */}
            <div className={styles.quickGrid}>
                <Link href="/academic/my-classes" className={styles.quickCard}>
                    <span className={`${styles.quickIcon} ${styles.qPurple}`}><School size={22} /></span>
                    <span>
                        <span className={styles.quickTitle}>Minhas turmas</span>
                        <span className={styles.quickText}>Turmas e alunos</span>
                    </span>
                </Link>
                <Link href="/academic/assessments" className={styles.quickCard}>
                    <span className={`${styles.quickIcon} ${styles.qBlue}`}><BarChart3 size={22} /></span>
                    <span>
                        <span className={styles.quickTitle}>Lançar notas</span>
                        <span className={styles.quickText}>Avaliações por período</span>
                    </span>
                </Link>
                <Link href="/attendance" className={styles.quickCard}>
                    <span className={`${styles.quickIcon} ${styles.qGreen}`}><CalendarCheck size={22} /></span>
                    <span>
                        <span className={styles.quickTitle}>Presenças</span>
                        <span className={styles.quickText}>Chamada do dia</span>
                    </span>
                </Link>
                <Link href="/academic-reports" className={styles.quickCard}>
                    <span className={`${styles.quickIcon} ${styles.qOrange}`}><FileSpreadsheet size={22} /></span>
                    <span>
                        <span className={styles.quickTitle}>Pautas</span>
                        <span className={styles.quickText}>Médias das disciplinas</span>
                    </span>
                </Link>
            </div>

            {!isLoading && overview.length === 0 ? (
                <div className={styles.emptyBig}>
                    <div className={styles.emptyIcon}><School size={34} /></div>
                    <p className={styles.emptyTitle}>Ainda não tem turmas atribuídas</p>
                    <p>Quando a secretaria lhe atribuir turmas e disciplinas, o seu painel fica disponível aqui.</p>
                </div>
            ) : (
                <div className={styles.columns}>
                    {/* Presenças de hoje */}
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <span className={styles.sectionTitleIcon}><CalendarCheck size={16} /></span>
                                Presenças de hoje
                            </h2>
                            {!isLoading && stats.attendanceTotal > 0 && (
                                <span className={styles.sectionMeta}>{stats.attendanceDone}/{stats.attendanceTotal} registadas</span>
                            )}
                        </div>
                        {!isLoading && stats.attendanceTotal > 0 && (
                            <div className={styles.progress} style={{ marginTop: 'var(--spacing-md)' }}>
                                <div className={styles.progressBar} style={{ width: `${attendancePercent}%` }} />
                            </div>
                        )}
                        <div className={styles.list}>
                            {isLoading && [0, 1, 2].map(i => <div key={i} className={styles.skeletonRow} />)}
                            {!isLoading && overview.map(({ assignment, attendanceToday }) => (
                                <div key={assignment.uuid} className={styles.row}>
                                    <div className={styles.rowMain}>
                                        {classBadge(assignment)}
                                        <div className={styles.rowText}>
                                            <span className={styles.rowTitle}>{assignment.subjectName}</span>
                                            <span className={styles.rowSubtitle}>{assignment.studentsCount ?? 0} alunos</span>
                                        </div>
                                    </div>
                                    <div className={styles.rowActions}>
                                        {attendanceToday === null ? (
                                            <span className={`${styles.status} ${styles.sNeutral}`}>Indisponível</span>
                                        ) : attendanceToday ? (
                                            <span className={`${styles.status} ${styles.sDone}`}><CheckCircle2 size={12} /> Registada</span>
                                        ) : (
                                            <span className={`${styles.status} ${styles.sPending}`}><Clock size={12} /> Por registar</span>
                                        )}
                                        <Link className={styles.actionLink} href={`/attendance?assignment=${assignment.uuid}`}>
                                            {attendanceToday ? 'Ver' : 'Fazer chamada'}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Estado das notas */}
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <span className={styles.sectionTitleIcon}><BarChart3 size={16} /></span>
                                Estado das notas
                            </h2>
                            <span className={styles.sectionMeta}>por período</span>
                        </div>
                        <div className={styles.list}>
                            {isLoading && [0, 1, 2].map(i => <div key={i} className={styles.skeletonRow} />)}
                            {!isLoading && overview.map(({ assignment, periods }) => (
                                <div key={assignment.uuid} className={styles.row}>
                                    <div className={styles.rowMain}>
                                        {classBadge(assignment)}
                                        <div className={styles.rowText}>
                                            <span className={styles.rowTitle}>
                                                {assignment.subjectName}
                                                {assignment.isClassDirector && (
                                                    <Star size={12} className={styles.director} fill="currentColor" aria-label="Diretor de turma" />
                                                )}
                                            </span>
                                            <div className={styles.periods}>
                                                {periods === null && <span className={`${styles.status} ${styles.sNeutral}`}>Sem configuração académica</span>}
                                                {periods?.map(p => (
                                                    <span key={p.academicPeriod} className={`${styles.status} ${statusClass(p.status)}`} title={p.displayName}>
                                                        {p.displayName}: {p.status ? SUBMISSION_STATUS_LABELS[p.status] : 'Por lançar'}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.rowActions}>
                                        <Link className={styles.actionLink} href={`/academic/assessments?assignment=${assignment.uuid}`}>
                                            <BarChart3 size={12} /> Notas
                                        </Link>
                                        <Link className={styles.actionLink} href={`/academic-reports?assignment=${assignment.uuid}`}>
                                            <FileSpreadsheet size={12} /> Pauta
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};
