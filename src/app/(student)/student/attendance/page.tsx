'use client';

import React, { useMemo, useState } from 'react';
import { CalendarCheck, CalendarX2, Clock3, FileCheck2, Loader2 } from 'lucide-react';
import { useStudentAttendanceFeed } from '@/features/student-portal/hooks/useStudentPortal';
import {
  Badge,
  EmptyState,
  ErrorState,
  ListSkeleton,
  ProgressBar,
  ScoreRing,
  SectionHeader,
  Skeleton,
  toneClass,
} from '@/features/student-portal/components/PortalUI/PortalUI';
import { ATTENDANCE_LABEL, formatDate, rateTone } from '@/features/student-portal/utils/format';
import type { AttendanceStatus } from '@/features/student-portal/types/student-portal.types';
import styles from '@/features/student-portal/styles/portal.module.css';
import local from './page.module.css';

const STATUS_TONE: Record<AttendanceStatus, 'excellent' | 'danger' | 'warning' | 'good'> = {
  PRESENT: 'excellent',
  ABSENT: 'danger',
  LATE: 'warning',
  EXCUSED: 'good',
};

const STATUS_ICON: Record<AttendanceStatus, React.ReactNode> = {
  PRESENT: <CalendarCheck size={18} />,
  ABSENT: <CalendarX2 size={18} />,
  LATE: <Clock3 size={18} />,
  EXCUSED: <FileCheck2 size={18} />,
};

const FILTERS: { value?: AttendanceStatus; label: string }[] = [
  { label: 'Todos' },
  { value: 'ABSENT', label: 'Faltas' },
  { value: 'LATE', label: 'Atrasos' },
  { value: 'EXCUSED', label: 'Justificadas' },
  { value: 'PRESENT', label: 'Presenças' },
];

export default function StudentAttendancePage() {
  const [status, setStatus] = useState<AttendanceStatus | undefined>();
  const feed = useStudentAttendanceFeed(status);

  const firstPage = feed.data?.pages[0];
  const summary = firstPage?.summary;
  const records = useMemo(() => feed.data?.pages.flatMap(page => page.records) ?? [], [feed.data]);

  // Agrupa os registos por dia
  const groups = useMemo(() => {
    const map = new Map<string, typeof records>();
    for (const record of records) {
      const list = map.get(record.date) ?? [];
      list.push(record);
      map.set(record.date, list);
    }
    return Array.from(map.entries());
  }, [records]);

  if (feed.isError && !feed.data) {
    return (
      <div className={styles.page}>
        <ErrorState error={feed.error} onRetry={() => feed.refetch()} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Resumo */}
      {!summary ? (
        <Skeleton height={168} radius={20} />
      ) : (
        <section className={`${styles.card} ${local.summary}`}>
          <div className={local.summaryTop}>
            <ScoreRing
              value={summary.rate}
              max={100}
              size={92}
              stroke={8}
              tone={rateTone(summary.rate)}
              label={summary.rate === null ? '—' : `${Math.round(summary.rate)}%`}
              caption="ASSIDUIDADE"
            />
            <div className={local.summaryText}>
              <strong>{summary.total} {summary.total === 1 ? 'aula registada' : 'aulas registadas'}</strong>
              <span className={styles.muted}>
                Presenças e atrasos sobre as aulas registadas. Faltas justificadas não contam.
              </span>
            </div>
          </div>
          <div className={local.counters}>
            {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map(key => (
              <div key={key} className={`${local.counter} ${toneClass(STATUS_TONE[key])}`}>
                <strong>{summary[key.toLowerCase() as 'present' | 'absent' | 'late' | 'excused']}</strong>
                <span>{key === 'PRESENT' ? 'Presenças' : key === 'ABSENT' ? 'Faltas' : key === 'LATE' ? 'Atrasos' : 'Justif.'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Por disciplina */}
      {firstPage && firstPage.bySubject.length > 0 && (
        <section className={styles.section}>
          <SectionHeader title="Por disciplina" />
          <div className={`${styles.card} ${styles.cardPadded} ${local.subjects}`}>
            {firstPage.bySubject.map(subject => (
              <div key={subject.subjectUuid} className={local.subjectRow}>
                <div className={local.subjectLine}>
                  <span className={local.subjectName}>{subject.subjectName}</span>
                  <span className={local.subjectMeta}>
                    {subject.absent > 0 && <span style={{ color: 'var(--tone-danger)' }}>{subject.absent} falta{subject.absent > 1 ? 's' : ''} · </span>}
                    <strong>{subject.rate === null ? '—' : `${Math.round(subject.rate)}%`}</strong>
                  </span>
                </div>
                <ProgressBar value={subject.rate} tone={rateTone(subject.rate)} label={subject.subjectName} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Histórico */}
      <section className={styles.section}>
        <SectionHeader title="Histórico" />
        <div className={styles.chips} role="tablist" aria-label="Filtrar por estado">
          {FILTERS.map(filter => {
            const active = filter.value === status;
            return (
              <button
                key={filter.label}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                onClick={() => setStatus(filter.value)}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {feed.isLoading ? (
          <ListSkeleton rows={5} />
        ) : groups.length === 0 ? (
          <div className={styles.card}>
            <EmptyState
              icon={<CalendarCheck size={26} />}
              title={status ? 'Nenhum registo com este estado' : 'Sem registos de presença'}
              text={status ? 'Experimente outro filtro.' : 'As presenças marcadas pelos professores aparecem aqui.'}
            />
          </div>
        ) : (
          <>
            {groups.map(([date, items]) => (
              <div key={date} className={local.day}>
                <p className={local.dayLabel}>
                  {formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className={`${styles.card} ${styles.list}`}>
                  {items.map(record => (
                    <div key={record.uuid} className={styles.listItem}>
                      <span className={`${styles.listIcon} ${toneClass(STATUS_TONE[record.status])}`}>
                        {STATUS_ICON[record.status]}
                      </span>
                      <span className={styles.listBody}>
                        <span className={styles.listTitle}>{record.subjectName}</span>
                        {record.remarks && <span className={styles.listSubtitle}>{record.remarks}</span>}
                      </span>
                      <Badge tone={STATUS_TONE[record.status]}>{ATTENDANCE_LABEL[record.status]}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {feed.hasNextPage && (
              <button
                type="button"
                className={`${styles.button} ${styles.buttonGhost} ${styles.buttonBlock}`}
                onClick={() => feed.fetchNextPage()}
                disabled={feed.isFetchingNextPage}
              >
                {feed.isFetchingNextPage ? <Loader2 size={16} className={local.spin} /> : null}
                {feed.isFetchingNextPage ? 'A carregar…' : 'Carregar mais'}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
