// src/features/academic/teachers/components/TeacherDetails.tsx

'use client';

import React, { useEffect, useState } from 'react';
import {
    User,
    Mail,
    Phone,
    Calendar,
    FileText,
    Home,
    Users,
    Briefcase,
    Award,
    BookOpen,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    Power,
    PowerOff,
    X,
    IdCard,
    Star,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { documentTypeLabel } from '@/shared/constants/document-types';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { SystemAccessSection } from '@/features/academic/shared/components/SystemAccessSection';
import { teacherAssignmentService } from '@/features/academic/teacher-assignments/services/teacher-assignment.service';
import type { TeacherAssignment } from '@/features/academic/teacher-assignments/types/teacher-assignment.types';
import { teacherService } from '../services/teacher.service';
import type { TeacherWithUser } from '../types/teacher.types';
import styles from '@/features/academic/shared/components/PersonDetails.module.css';

interface TeacherDetailsProps {
    teacher: TeacherWithUser | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
    onToggleStatus?: () => void;
    onDelete?: () => void;
    // acesso criado/alterado: recarregar o professor
    onAccessChanged?: () => void;
    canManageAccess?: boolean;
    canReadAssignments?: boolean;
}

type AssignmentRow = TeacherAssignment & { academicYearName?: string };

const getGenderLabel = (gender: string) => (gender === 'MALE' ? 'Masculino' : 'Feminino');

// Atribuições (turma/disciplina) do professor, ativas primeiro
const TeacherAssignmentsSection: React.FC<{ teacherUuid: string }> = ({ teacherUuid }) => {
    const [rows, setRows] = useState<AssignmentRow[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setRows(null);
        setError(null);
        teacherAssignmentService
            .getAll({ teacherUuid, limit: 100 })
            .then(result => {
                if (cancelled) return;
                const data = (result.data as AssignmentRow[]).map(item => ({
                    ...item,
                    isActive: Boolean(item.isActive),
                    isClassDirector: Boolean(item.isClassDirector),
                }));
                data.sort((a, b) => Number(b.isActive) - Number(a.isActive));
                setRows(data);
            })
            .catch(err => {
                if (!cancelled) setError(getApiErrorMessage(err, 'Não foi possível carregar as atribuições.'));
            });
        return () => {
            cancelled = true;
        };
    }, [teacherUuid]);

    const activeCount = rows?.filter(row => row.isActive).length ?? 0;

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                    <BookOpen size={18} />
                </div>
                <h3 className={styles.sectionTitle}>Turmas e Disciplinas</h3>
                {rows && (
                    <Badge variant={activeCount > 0 ? 'primary' : 'neutral'} size="sm">
                        {activeCount} ativa(s)
                    </Badge>
                )}
            </div>
            <div className={styles.infoGrid}>
                {error ? (
                    <div className={`${styles.infoItem} ${styles.noUserFull}`}>
                        <span className={styles.infoValue}>{error}</span>
                    </div>
                ) : rows === null ? (
                    <div className={`${styles.infoItem} ${styles.noUserFull}`}>
                        <span className={styles.infoValue}>A carregar…</span>
                    </div>
                ) : rows.length === 0 ? (
                    <div className={`${styles.infoItem} ${styles.noUserFull}`}>
                        <span className={styles.infoValue}>
                            <span className={styles.noUser}>Sem atribuições</span>
                            <span className={styles.noUserHint}>Atribua turmas e disciplinas em Académico › Atribuições.</span>
                        </span>
                    </div>
                ) : (
                    rows.map(row => (
                        <div key={row.uuid} className={styles.infoItem} style={{ opacity: row.isActive ? 1 : 0.6 }}>
                            <span className={styles.infoLabel}>
                                <Users size={12} />
                                {row.gradeName} · Turma {row.className}
                                {row.academicYearName ? ` · ${row.academicYearName}` : ''}
                            </span>
                            <span className={styles.infoValue}>
                                {row.subjectName}
                                {row.isClassDirector && (
                                    <Badge variant="warning" size="sm">
                                        <Star size={10} /> Diretor de turma
                                    </Badge>
                                )}
                                {!row.isActive && <Badge variant="neutral" size="sm">Inativa</Badge>}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export const TeacherDetails: React.FC<TeacherDetailsProps> = ({
    teacher,
    isOpen,
    onClose,
    onEdit,
    onToggleStatus,
    onDelete,
    onAccessChanged,
    canManageAccess = true,
    canReadAssignments = true,
}) => {
    if (!teacher) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Professor" size="lg">
            <div className={styles.container}>
                {/* Cabeçalho */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.avatar}>
                            <User size={32} />
                        </div>
                        <div className={styles.headerInfo}>
                            <h2 className={styles.studentName}>{teacher.fullName}</h2>
                            <div className={styles.studentMeta}>
                                <span className={styles.metaItem}>
                                    <FileText size={12} />
                                    {teacher.teacherNumber}
                                </span>
                                <span className={styles.metaDivider}>•</span>
                                <span className={styles.metaItem}>
                                    <Award size={12} />
                                    {teacher.specialization || 'Sem especialização'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <Badge variant={teacher.isActive ? 'success' : 'error'} size="md">
                            <span className={styles.statusBadge}>
                                {teacher.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                {teacher.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                        </Badge>
                    </div>
                </div>

                <div className={styles.content}>
                    {/* Informações Pessoais */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionIcon}>
                                <User size={18} />
                            </div>
                            <h3 className={styles.sectionTitle}>Informações Pessoais</h3>
                        </div>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    <User size={12} />
                                    Nome Completo
                                </span>
                                <span className={styles.infoValue}>{teacher.fullName}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    <Users size={12} />
                                    Género
                                </span>
                                <span className={styles.infoValue}>{getGenderLabel(teacher.gender)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    <Calendar size={12} />
                                    Data de Nascimento
                                </span>
                                <span className={styles.infoValue}>{formatDisplayDate(teacher.birthDate)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    <Home size={12} />
                                    Endereço
                                </span>
                                <span className={styles.infoValue}>{teacher.address || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contactos */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionIcon}>
                                <Phone size={18} />
                            </div>
                            <h3 className={styles.sectionTitle}>Contactos</h3>
                        </div>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    <Mail size={12} />
                                    Email
                                </span>
                                <span className={styles.infoValue}>
                                    {teacher.email ? (
                                        <a href={`mailto:${teacher.email}`} className={styles.contactLink}>
                                            {teacher.email}
                                        </a>
                                    ) : (
                                        'N/A'
                                    )}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    <Phone size={12} />
                                    Telefone
                                </span>
                                <span className={styles.infoValue}>
                                    {teacher.phone ? (
                                        <a href={`tel:${teacher.phone}`} className={styles.contactLink}>
                                            {teacher.phone}
                                        </a>
                                    ) : (
                                        'N/A'
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Documentação */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionIcon}>
                                <IdCard size={18} />
                            </div>
                            <h3 className={styles.sectionTitle}>Documentação</h3>
                        </div>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    <FileText size={12} />
                                    Tipo de Documento
                                </span>
                                <span className={styles.infoValue}>{documentTypeLabel(teacher.documentType)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    <FileText size={12} />
                                    Número do Documento
                                </span>
                                <span className={styles.infoValue}>{teacher.documentNumber || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Dados Profissionais */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionIcon}>
                                <Briefcase size={18} />
                            </div>
                            <h3 className={styles.sectionTitle}>Dados Profissionais</h3>
                        </div>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    <FileText size={12} />
                                    Nº de Professor
                                </span>
                                <span className={styles.infoValue}>{teacher.teacherNumber}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    <Calendar size={12} />
                                    Data de Contratação
                                </span>
                                <span className={styles.infoValue}>{formatDisplayDate(teacher.hireDate)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    <Award size={12} />
                                    Especialização
                                </span>
                                <span className={styles.infoValue}>{teacher.specialization || 'N/A'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>
                                    <Calendar size={12} />
                                    Registado em
                                </span>
                                <span className={styles.infoValue}>{formatDisplayDate(teacher.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {canReadAssignments && <TeacherAssignmentsSection teacherUuid={teacher.uuid} />}

                    <SystemAccessSection
                        access={teacher.user}
                        personActive={teacher.isActive}
                        personNoun="professor"
                        canManage={canManageAccess}
                        onCreate={() => teacherService.createUser(teacher.uuid)}
                        onResetPassword={() => teacherService.resetPassword(teacher.uuid)}
                        onSetActive={isActive => teacherService.setAccessStatus(teacher.uuid, isActive)}
                        onChanged={() => onAccessChanged?.()}
                    />
                </div>

                {/* Rodapé */}
                <div className={styles.footer}>
                    <div className={styles.footerLeft}>
                        <Button variant="secondary" onClick={onClose} icon={<X size={18} />}>
                            Fechar
                        </Button>
                    </div>
                    <div className={styles.footerRight}>
                        {onToggleStatus && (
                            <Button
                                variant={teacher.isActive ? 'warning' : 'success'}
                                onClick={onToggleStatus}
                                icon={teacher.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                            >
                                {teacher.isActive ? 'Desativar' : 'Ativar'}
                            </Button>
                        )}
                        {onEdit && (
                            <Button variant="primary" onClick={onEdit} icon={<Edit size={18} />}>
                                Editar
                            </Button>
                        )}
                        {onDelete && (
                            <Button variant="danger" onClick={onDelete} icon={<Trash2 size={18} />}>
                                Excluir
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
