// src/app/(dashboard)/academic/my-classes/page.tsx

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    BarChart3,
    BookOpen,
    CalendarCheck,
    FileSpreadsheet,
    Info,
    School,
    Search,
    Star,
    Users,
} from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { assessmentService } from '@/features/academic/assessments/services/assessment.service';
import type { EnrolledStudentOption, TeacherAssignmentOption } from '@/features/academic/assessments/types/assessment.types';
import styles from './page.module.css';

interface ClassGroup {
    classUuid: string;
    className: string;
    gradeName: string;
    academicYearName: string;
    subjects: TeacherAssignmentOption[];
    isDirector: boolean;
    studentsCount: number;
}

type RosterStudent = EnrolledStudentOption & { gender?: string | null };

const AVATAR_COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#14B8A6', '#6366F1', '#EF4444'];

const initials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('') || '?';

// Cor estável por aluno
const avatarColor = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export default function MyClassesPage() {
    const { user } = useAuth();
    const isTeacher = !!user?.teacher;
    const { showError } = useToast();

    const [assignments, setAssignments] = useState<TeacherAssignmentOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openClass, setOpenClass] = useState<ClassGroup | null>(null);
    const [students, setStudents] = useState<RosterStudent[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!isTeacher) {
            setIsLoading(false);
            return;
        }
        assessmentService
            .getTeacherAssignments(true)
            .then(setAssignments)
            .catch(err => showError('Erro', getApiErrorMessage(err, 'Não foi possível carregar as suas turmas')))
            .finally(() => setIsLoading(false));
    }, [isTeacher]);

    // Uma turma pode ter várias disciplinas do mesmo professor
    const classes = useMemo<ClassGroup[]>(() => {
        const map = new Map<string, ClassGroup>();
        assignments.forEach(a => {
            const entry = map.get(a.classUuid) ?? {
                classUuid: a.classUuid,
                className: a.className,
                gradeName: a.gradeName,
                academicYearName: a.academicYearName,
                subjects: [],
                isDirector: false,
                studentsCount: a.studentsCount ?? 0,
            };
            entry.subjects.push(a);
            entry.isDirector = entry.isDirector || !!a.isClassDirector;
            map.set(a.classUuid, entry);
        });
        return Array.from(map.values());
    }, [assignments]);

    const totals = useMemo(() => ({
        classes: classes.length,
        subjects: assignments.length,
        students: classes.reduce((sum, c) => sum + c.studentsCount, 0),
    }), [classes, assignments]);

    const showStudents = async (group: ClassGroup) => {
        setOpenClass(group);
        setSearch('');
        try {
            setIsLoadingStudents(true);
            setStudents(await assessmentService.getMyClassStudents(group.classUuid));
        } catch (err) {
            setStudents([]);
            showError('Erro', getApiErrorMessage(err, 'Não foi possível carregar os alunos'));
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const filteredStudents = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return students;
        return students.filter(s =>
            s.studentName.toLowerCase().includes(term)
            || s.studentNumber.toLowerCase().includes(term)
            || (s.enrollmentNumber ?? '').toLowerCase().includes(term)
        );
    }, [students, search]);

    const genderCounts = useMemo(() => ({
        male: students.filter(s => s.gender === 'MALE').length,
        female: students.filter(s => s.gender === 'FEMALE').length,
    }), [students]);

    const firstName = user?.teacher?.fullName?.split(' ')[0] ?? user?.firstName ?? '';

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroMain}>
                    <div className={styles.heroIcon}>
                        <School size={30} />
                    </div>
                    <div>
                        <p className={styles.heroEyebrow}>Portal do professor</p>
                        <h1 className={styles.heroTitle}>As minhas turmas</h1>
                        <p className={styles.heroSubtitle}>
                            {firstName ? `Olá ${firstName}, ` : ''}aqui estão as turmas e disciplinas que leciona.
                        </p>
                    </div>
                </div>
                {isTeacher && (
                    <div className={styles.heroStats}>
                        <div className={styles.heroStat}>
                            <span className={styles.heroStatValue}>{isLoading ? '—' : totals.classes}</span>
                            <span className={styles.heroStatLabel}><School size={12} /> Turmas</span>
                        </div>
                        <div className={styles.heroStat}>
                            <span className={styles.heroStatValue}>{isLoading ? '—' : totals.subjects}</span>
                            <span className={styles.heroStatLabel}><BookOpen size={12} /> Disciplinas</span>
                        </div>
                        <div className={styles.heroStat}>
                            <span className={styles.heroStatValue}>{isLoading ? '—' : totals.students}</span>
                            <span className={styles.heroStatLabel}><Users size={12} /> Alunos</span>
                        </div>
                    </div>
                )}
            </section>

            {!isTeacher && (
                <div className={styles.notice}>
                    <Info size={18} />
                    <span>Esta área é exclusiva de professores. O seu utilizador não está associado a nenhum professor.</span>
                </div>
            )}

            {/* Carregamento */}
            {isTeacher && isLoading && (
                <div className={styles.grid}>
                    {[0, 1, 2].map(i => <div key={i} className={styles.skeleton} />)}
                </div>
            )}

            {/* Sem turmas */}
            {isTeacher && !isLoading && classes.length === 0 && (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}><School size={34} /></div>
                    <p className={styles.emptyTitle}>Ainda não tem turmas atribuídas</p>
                    <p>Quando a secretaria lhe atribuir turmas e disciplinas, elas aparecem aqui.</p>
                </div>
            )}

            {/* Cartões das turmas */}
            {isTeacher && !isLoading && classes.length > 0 && (
                <div className={styles.grid}>
                    {classes.map((group, index) => (
                        <article key={group.classUuid} className={styles.classCard}>
                            <header className={`${styles.cardBand} ${styles[`band${index % 6}`]}`}>
                                <div className={styles.cardBandTop}>
                                    <div>
                                        <p className={styles.gradeName}>{group.gradeName}</p>
                                        <h2 className={styles.className}>Turma {group.className}</h2>
                                        <span className={styles.yearTag}>Ano letivo {group.academicYearName}</span>
                                    </div>
                                    {group.isDirector && (
                                        <span className={styles.directorBadge}>
                                            <Star size={12} fill="currentColor" /> Diretor de turma
                                        </span>
                                    )}
                                </div>
                            </header>

                            <div className={styles.cardStats}>
                                <div className={styles.cardStat}>
                                    <span className={styles.cardStatIcon}><Users size={18} /></span>
                                    <div>
                                        <span className={styles.cardStatValue}>{group.studentsCount}</span>
                                        <span className={styles.cardStatLabel}>Alunos</span>
                                    </div>
                                </div>
                                <div className={styles.cardStat}>
                                    <span className={styles.cardStatIcon}><BookOpen size={18} /></span>
                                    <div>
                                        <span className={styles.cardStatValue}>{group.subjects.length}</span>
                                        <span className={styles.cardStatLabel}>
                                            {group.subjects.length === 1 ? 'Disciplina' : 'Disciplinas'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.subjects}>
                                <span className={styles.subjectsLabel}>As minhas disciplinas</span>
                                {group.subjects.map(subject => (
                                    <div key={subject.uuid} className={styles.subjectRow}>
                                        <span className={styles.subjectName}>
                                            <span className={styles.subjectDot} />
                                            {subject.subjectName}
                                        </span>
                                        <div className={styles.subjectActions}>
                                            <Link className={styles.actionLink} href={`/academic/assessments?assignment=${subject.uuid}`} title="Lançar notas">
                                                <BarChart3 size={12} /> Notas
                                            </Link>
                                            <Link className={styles.actionLink} href={`/attendance?assignment=${subject.uuid}`} title="Registar presenças">
                                                <CalendarCheck size={12} /> Presenças
                                            </Link>
                                            <Link className={styles.actionLink} href={`/academic-reports?assignment=${subject.uuid}`} title="Ver pauta">
                                                <FileSpreadsheet size={12} /> Pauta
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <footer className={styles.cardFooter}>
                                <button type="button" className={styles.studentsButton} onClick={() => showStudents(group)}>
                                    <Users size={16} /> Ver alunos da turma
                                </button>
                            </footer>
                        </article>
                    ))}
                </div>
            )}

            {/* Alunos da turma */}
            <Modal
                isOpen={openClass !== null}
                onClose={() => setOpenClass(null)}
                title={openClass ? `${openClass.gradeName} · Turma ${openClass.className}` : ''}
                size="lg"
            >
                <div className={styles.rosterHeader}>
                    <div className={styles.rosterChips}>
                        <span className={styles.rosterChip}><Users size={12} /> {students.length} alunos</span>
                        {genderCounts.male > 0 && <span className={styles.rosterChip}>{genderCounts.male} rapazes</span>}
                        {genderCounts.female > 0 && <span className={styles.rosterChip}>{genderCounts.female} raparigas</span>}
                    </div>
                    <label className={styles.searchBox}>
                        <Search size={16} />
                        <input
                            className={styles.searchInput}
                            placeholder="Procurar aluno ou número..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </label>
                </div>

                {isLoadingStudents && <p className={styles.loadingText}>A carregar alunos...</p>}

                {!isLoadingStudents && filteredStudents.length === 0 && (
                    <p className={styles.loadingText}>
                        {students.length === 0 ? 'Esta turma ainda não tem alunos matriculados.' : 'Nenhum aluno corresponde à pesquisa.'}
                    </p>
                )}

                {!isLoadingStudents && filteredStudents.length > 0 && (
                    <div className={styles.studentGrid}>
                        {filteredStudents.map((student, index) => (
                            <div key={student.studentUuid} className={styles.studentCard}>
                                <span className={styles.avatar} style={{ background: avatarColor(student.studentUuid) }}>
                                    {initials(student.studentName)}
                                </span>
                                <div className={styles.studentInfo}>
                                    <span className={styles.studentName} title={student.studentName}>{student.studentName}</span>
                                    <span className={styles.studentMeta}>{student.studentNumber}</span>
                                    {student.enrollmentNumber && (
                                        <span className={styles.studentMeta}>Matrícula {student.enrollmentNumber}</span>
                                    )}
                                </div>
                                <span className={styles.studentIndex}>#{index + 1}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}
