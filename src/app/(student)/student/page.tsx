'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Clock,
  GraduationCap,
  MapPin,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import {
  useStudentAttendance,
  useStudentGrades,
  useStudentProfile,
} from '@/features/student-portal/hooks/useStudentPortal';
import {
  Badge,
  EmptyState,
  ErrorState,
  ListSkeleton,
  ScoreRing,
  SectionHeader,
  Skeleton,
  toneClass,
} from '@/features/student-portal/components/PortalUI/PortalUI';
import {
  ATTENDANCE_LABEL,
  formatDate,
  formatScore,
  greeting,
  rateTone,
  scoreTone,
  SHIFT_LABEL,
} from '@/features/student-portal/utils/format';
import type { AttendanceStatus } from '@/features/student-portal/types/student-portal.types';
import styles from '@/features/student-portal/styles/portal.module.css';

const STATUS_TONE: Record<AttendanceStatus, 'excellent' | 'danger' | 'warning' | 'good'> = {
  PRESENT: 'excellent',
  ABSENT: 'danger',
  LATE: 'warning',
  EXCUSED: 'good',
};

export default function StudentHomePage() {
  const profileQuery = useStudentProfile();
  const gradesQuery = useStudentGrades();
  const attendanceQuery = useStudentAttendance(1, undefined, 5);

  const profile = profileQuery.data;
  const grades = gradesQuery.data;
  const attendance = attendanceQuery.data;
  const enrollment = profile?.enrollment;

  if (profileQuery.isError) {
    return (
      <div className={styles.page}>
        <ErrorState error={profileQuery.error} onRetry={() => profileQuery.refetch()} />
      </div>
    );
  }

  const average = grades?.summary.average ?? null;
  const rate = attendance?.summary.rate ?? null;
  const visibleSubjects = (grades?.subjects ?? []).filter(subject => subject.visibility !== 'PENDING');

  return (
    <div className={styles.page}>
      {/* Saudação e turma */}
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>{greeting()},</p>
        {profile ? (
          <h1 className={styles.heroTitle}>{profile.student.firstName || profile.student.fullName} 👋</h1>
        ) : (
          <Skeleton height={28} width="55%" />
        )}

        {enrollment ? (
          <div className={styles.heroChips}>
            <span className={styles.heroChip}>
              <GraduationCap size={13} /> {enrollment.gradeName} · Turma {enrollment.className}
            </span>
            <span className={styles.heroChip}>
              <CalendarDays size={13} /> Ano letivo {enrollment.academicYearName}
            </span>
            {enrollment.shift && (
              <span className={styles.heroChip}>
                <Clock size={13} /> {SHIFT_LABEL[enrollment.shift] ?? enrollment.shift}
              </span>
            )}
            {enrollment.room && (
              <span className={styles.heroChip}>
                <MapPin size={13} /> Sala {enrollment.room}
              </span>
            )}
          </div>
        ) : profile ? (
          <div className={styles.heroChips}>
            <span className={styles.heroChip}>Sem matrícula ativa</span>
          </div>
        ) : null}
      </section>

      {/* Resumo */}
      <section className={styles.statGrid} aria-label="Resumo">
        <Link href="/student/grades" className={styles.stat}>
          <span className={`${styles.statIcon} ${toneClass(scoreTone(average))}`}>
            <TrendingUp size={17} />
          </span>
          <span className={styles.statValue}>{gradesQuery.isLoading ? '…' : formatScore(average)}</span>
          <span className={styles.statLabel}>Média{grades?.period ? ` · ${grades.period.displayName}` : ''}</span>
        </Link>
        <Link href="/student/attendance" className={styles.stat}>
          <span className={`${styles.statIcon} ${toneClass(rateTone(rate))}`}>
            <CalendarCheck size={17} />
          </span>
          <span className={styles.statValue}>{attendanceQuery.isLoading ? '…' : rate === null ? '—' : `${Math.round(rate)}%`}</span>
          <span className={styles.statLabel}>Assiduidade</span>
        </Link>
        <Link href="/student/subjects" className={styles.stat}>
          <span className={`${styles.statIcon} ${toneClass('good')}`}>
            <BookOpen size={17} />
          </span>
          <span className={styles.statValue}>{profile ? profile.subjectsCount : '…'}</span>
          <span className={styles.statLabel}>Disciplinas</span>
        </Link>
      </section>

      <div className={styles.twoCol}>
        {/* Notas do período */}
        <section className={styles.section}>
          <SectionHeader
            title={grades?.period ? `Notas · ${grades.period.displayName}` : 'Notas'}
            action={
              <Link href="/student/grades" className={styles.sectionLink}>
                Ver tudo <ChevronRight size={15} />
              </Link>
            }
          />
          {gradesQuery.isLoading ? (
            <ListSkeleton rows={3} />
          ) : gradesQuery.isError ? (
            <ErrorState error={gradesQuery.error} onRetry={() => gradesQuery.refetch()} />
          ) : visibleSubjects.length === 0 ? (
            <div className={styles.card}>
              <EmptyState
                icon={<GraduationCap size={26} />}
                title="Ainda sem notas"
                text="Quando os professores publicarem as notas, elas aparecem aqui."
              />
            </div>
          ) : (
            <div className={`${styles.card} ${styles.list}`}>
              {visibleSubjects.slice(0, 5).map(subject => (
                <Link key={subject.subjectUuid} href="/student/grades" className={styles.listItem}>
                  <ScoreRing
                    value={subject.finalScore}
                    max={20}
                    size={44}
                    stroke={4}
                    tone={scoreTone(subject.finalScore)}
                    label={formatScore(subject.finalScore)}
                  />
                  <span className={styles.listBody}>
                    <span className={styles.listTitle}>{subject.subjectName}</span>
                    <span className={styles.listSubtitle}>{subject.teacherName ?? 'Professor por atribuir'}</span>
                  </span>
                  {subject.visibility === 'PROVISIONAL' ? (
                    <Badge tone="warning">Provisória</Badge>
                  ) : subject.isApproved === false ? (
                    <Badge tone="danger">Negativa</Badge>
                  ) : subject.isApproved ? (
                    <Badge tone="excellent">Positiva</Badge>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Presenças recentes */}
        <section className={styles.section}>
          <SectionHeader
            title="Presenças recentes"
            action={
              <Link href="/student/attendance" className={styles.sectionLink}>
                Ver tudo <ChevronRight size={15} />
              </Link>
            }
          />
          {attendanceQuery.isLoading ? (
            <ListSkeleton rows={3} />
          ) : attendanceQuery.isError ? (
            <ErrorState error={attendanceQuery.error} onRetry={() => attendanceQuery.refetch()} />
          ) : !attendance?.records.length ? (
            <div className={styles.card}>
              <EmptyState
                icon={<CalendarCheck size={26} />}
                title="Sem registos"
                text="As presenças marcadas pelos professores aparecem aqui."
              />
            </div>
          ) : (
            <div className={`${styles.card} ${styles.list}`}>
              {attendance.records.map(record => (
                <div key={record.uuid} className={styles.listItem}>
                  <span className={`${styles.listIcon} ${toneClass(STATUS_TONE[record.status])}`}>
                    <CalendarCheck size={18} />
                  </span>
                  <span className={styles.listBody}>
                    <span className={styles.listTitle}>{record.subjectName}</span>
                    <span className={styles.listSubtitle}>
                      {formatDate(record.date, { weekday: 'short', day: '2-digit', month: 'short' })}
                    </span>
                  </span>
                  <Badge tone={STATUS_TONE[record.status]}>{ATTENDANCE_LABEL[record.status]}</Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Turma */}
      {enrollment && (
        <section className={styles.section}>
          <SectionHeader title="A minha turma" />
          <div className={`${styles.card} ${styles.list}`}>
            <div className={styles.listItem}>
              <span className={`${styles.listIcon} ${toneClass('accent')}`}>
                <UserRound size={18} />
              </span>
              <span className={styles.listBody}>
                <span className={styles.listSubtitle}>Diretor(a) de turma</span>
                <span className={styles.listTitle}>{enrollment.classDirectorName ?? 'Por atribuir'}</span>
              </span>
            </div>
            <div className={styles.listItem}>
              <span className={`${styles.listIcon} ${toneClass('accent')}`}>
                <GraduationCap size={18} />
              </span>
              <span className={styles.listBody}>
                <span className={styles.listSubtitle}>Curso</span>
                <span className={styles.listTitle}>{enrollment.programName}</span>
              </span>
            </div>
          </div>
        </section>
      )}

      {profileQuery.isLoading && <ListSkeleton rows={2} />}
    </div>
  );
}
