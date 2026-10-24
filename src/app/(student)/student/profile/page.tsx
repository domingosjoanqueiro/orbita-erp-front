'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Moon,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { useStudentProfile } from '@/features/student-portal/hooks/useStudentPortal';
import {
  ErrorState,
  ListSkeleton,
  SectionHeader,
  Skeleton,
} from '@/features/student-portal/components/PortalUI/PortalUI';
import {
  formatDate,
  GENDER_LABEL,
  initials,
  RELATIONSHIP_LABEL,
  SHIFT_LABEL,
} from '@/features/student-portal/utils/format';
import styles from '@/features/student-portal/styles/portal.module.css';
import local from './page.module.css';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Indique a senha atual'),
  newPassword: z.string()
    .min(8, 'Mínimo de 8 caracteres')
    .regex(/[A-Z]/, 'Inclua uma letra maiúscula')
    .regex(/[a-z]/, 'Inclua uma letra minúscula')
    .regex(/[0-9]/, 'Inclua um número')
    .regex(/[^A-Za-z0-9]/, 'Inclua um carácter especial'),
  confirmPassword: z.string().min(1, 'Confirme a nova senha'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={local.row}>
      <span className={local.rowLabel}>{label}</span>
      <span className={local.rowValue}>{value || '—'}</span>
    </div>
  );
}

// Folha que sobe do fundo do ecrã (padrão mobile)
function PasswordSheet({ onClose }: { onClose: () => void }) {
  const { changePassword } = useAuth();
  const [show, setShow] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const onSubmit = async (values: PasswordForm) => {
    setSubmitError(null);
    try {
      await changePassword(values.currentPassword, values.newPassword, values.confirmPassword);
      onClose();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(message ?? 'Não foi possível alterar a senha.');
    }
  };

  const fields: { name: keyof PasswordForm; label: string; autoComplete: string }[] = [
    { name: 'currentPassword', label: 'Senha atual', autoComplete: 'current-password' },
    { name: 'newPassword', label: 'Nova senha', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirmar nova senha', autoComplete: 'new-password' },
  ];

  return (
    <div className={local.backdrop} onClick={onClose}>
      <div
        className={local.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-sheet-title"
        onClick={event => event.stopPropagation()}
      >
        <span className={local.grabber} aria-hidden />
        <div className={local.sheetHeader}>
          <h2 id="password-sheet-title">Alterar senha</h2>
          <button type="button" className={local.close} onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <form className={local.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          {fields.map(field => (
            <label key={field.name} className={local.field}>
              <span>{field.label}</span>
              <input
                type={show ? 'text' : 'password'}
                autoComplete={field.autoComplete}
                className={`${local.input} ${errors[field.name] ? local.inputError : ''}`}
                {...register(field.name)}
              />
              {errors[field.name] && <small className={local.error}>{errors[field.name]?.message}</small>}
            </label>
          ))}

          <button type="button" className={local.toggleShow} onClick={() => setShow(value => !value)}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
            {show ? 'Ocultar senhas' : 'Mostrar senhas'}
          </button>

          {submitError && <p className={local.submitError}>{submitError}</p>}

          <button type="submit" className={`${styles.button} ${styles.buttonBlock}`} disabled={isSubmitting}>
            {isSubmitting ? 'A guardar…' : 'Guardar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data, isLoading, isError, error, refetch } = useStudentProfile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (isError) {
    return (
      <div className={styles.page}>
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  const student = data?.student;
  const enrollment = data?.enrollment;

  return (
    <div className={styles.page}>
      {/* Cabeçalho */}
      <section className={local.header}>
        <span className={local.avatar}>{initials(student?.fullName)}</span>
        {student ? (
          <>
            <h1 className={local.name}>{student.fullName}</h1>
            <p className={local.number}>Nº {student.studentNumber}</p>
          </>
        ) : (
          <>
            <Skeleton height={22} width={180} />
            <Skeleton height={14} width={100} />
          </>
        )}
      </section>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : (
        <>
          <section className={styles.section}>
            <SectionHeader title="Matrícula" />
            <div className={`${styles.card} ${local.rows}`}>
              {enrollment ? (
                <>
                  <InfoRow label="Nº de matrícula" value={enrollment.enrollmentNumber} />
                  <InfoRow label="Classe e turma" value={`${enrollment.gradeName} · Turma ${enrollment.className}`} />
                  <InfoRow label="Curso" value={enrollment.programName} />
                  <InfoRow label="Ano letivo" value={enrollment.academicYearName} />
                  <InfoRow label="Turno" value={enrollment.shift ? SHIFT_LABEL[enrollment.shift] ?? enrollment.shift : null} />
                  <InfoRow label="Sala" value={enrollment.room} />
                  <InfoRow label="Diretor(a) de turma" value={enrollment.classDirectorName} />
                  <InfoRow label="Data de matrícula" value={formatDate(enrollment.enrollmentDate)} />
                </>
              ) : (
                <InfoRow label="Estado" value="Sem matrícula ativa" />
              )}
            </div>
          </section>

          <section className={styles.section}>
            <SectionHeader title="Dados pessoais" />
            <div className={`${styles.card} ${local.rows}`}>
              <InfoRow label="Data de nascimento" value={formatDate(student?.birthDate)} />
              <InfoRow label="Género" value={student?.gender ? GENDER_LABEL[student.gender] ?? student.gender : null} />
              <InfoRow label="Nacionalidade" value={student?.nationality} />
              <InfoRow label="Telefone" value={student?.phone} />
              <InfoRow label="Email" value={student?.email} />
              <InfoRow label="Morada" value={student?.address} />
            </div>
          </section>

          {student?.guardianName && (
            <section className={styles.section}>
              <SectionHeader title="Encarregado de educação" />
              <div className={`${styles.card} ${local.rows}`}>
                <InfoRow label="Nome" value={student.guardianName} />
                <InfoRow
                  label="Parentesco"
                  value={student.guardianRelationship ? RELATIONSHIP_LABEL[student.guardianRelationship] ?? student.guardianRelationship : null}
                />
                <InfoRow
                  label="Telefone"
                  value={student.guardianPhone ? <a href={`tel:${student.guardianPhone}`} className={local.link}>{student.guardianPhone}</a> : null}
                />
              </div>
            </section>
          )}

          <p className={styles.muted} style={{ padding: '0 4px' }}>
            Algum dado está errado? Fale com a secretaria da escola para o corrigir.
          </p>
        </>
      )}

      {/* Definições */}
      <section className={styles.section}>
        <SectionHeader title="Definições" />
        <div className={`${styles.card} ${styles.list}`}>
          <button type="button" className={styles.listItem} onClick={toggleTheme} role="switch" aria-checked={theme === 'dark'}>
            <span className={`${styles.listIcon} ${styles['tone-accent']}`}><Moon size={18} /></span>
            <span className={styles.listBody}><span className={styles.listTitle}>Modo escuro</span></span>
            <span className={`${local.switch} ${theme === 'dark' ? local.switchOn : ''}`} aria-hidden />
          </button>
          <Link href="/student/notifications" className={styles.listItem}>
            <span className={`${styles.listIcon} ${styles['tone-accent']}`}><Bell size={18} /></span>
            <span className={styles.listBody}><span className={styles.listTitle}>Notificações</span></span>
            <ChevronRight size={18} color="var(--sp-text-3)" />
          </Link>
          <button type="button" className={styles.listItem} onClick={() => setSheetOpen(true)}>
            <span className={`${styles.listIcon} ${styles['tone-accent']}`}><KeyRound size={18} /></span>
            <span className={styles.listBody}><span className={styles.listTitle}>Alterar senha</span></span>
            <ChevronRight size={18} color="var(--sp-text-3)" />
          </button>
        </div>
      </section>

      <button
        type="button"
        className={`${styles.button} ${styles.buttonDanger} ${styles.buttonBlock}`}
        onClick={() => setConfirmLogout(true)}
      >
        <LogOut size={18} /> Terminar sessão
      </button>

      {sheetOpen && <PasswordSheet onClose={() => setSheetOpen(false)} />}

      <ConfirmDialog
        isOpen={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          logout();
        }}
        title="Terminar sessão"
        message="Tem a certeza de que pretende sair do portal?"
        type="warning"
        confirmText="Sair"
      />
    </div>
  );
}
