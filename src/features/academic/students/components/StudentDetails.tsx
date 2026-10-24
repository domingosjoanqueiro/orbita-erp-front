// src/features/academic/students/components/StudentDetails.tsx

'use client';

import React from 'react';
import {
    User,
    Mail,
    Phone,
    Calendar,
    FileText,
    MapPin,
    Globe,
    Heart,
    CheckCircle,
    XCircle,
    GraduationCap,
    Edit,
    Trash2,
    Power,
    PowerOff,
    X,
    IdCard,
    Home,
    Users,
    Briefcase,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { documentTypeLabel } from '@/shared/constants/document-types';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { SystemAccessSection } from '@/features/academic/shared/components/SystemAccessSection';
import { studentService } from '../services/student.service';
import type { StudentWithUser } from '../types/student.types';
import styles from './StudentDetails.module.css';

interface StudentDetailsProps {
    student: StudentWithUser | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit?: () => void;
    onToggleStatus?: () => void;
    onDelete?: () => void;
    // acesso criado/alterado: recarregar o estudante
    onAccessChanged?: () => void;
    canManageAccess?: boolean;
}

const getStatusBadge = (isActive: boolean) => {
    return (
        <Badge variant={isActive ? 'success' : 'error'} size="md">
            <span className={styles.statusBadge}>
                {isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {isActive ? 'Ativo' : 'Inativo'}
            </span>
        </Badge>
    );
};

const getGenderLabel = (gender: string) => {
    return gender === 'MALE' ? 'Masculino' : 'Feminino';
};

const formatDate = (date: string | undefined | null): string => formatDisplayDate(date);

const STUDENT_STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Ativo',
    INACTIVE: 'Inativo',
    GRADUATED: 'Graduado',
    TRANSFERRED: 'Transferido',
    SUSPENDED: 'Suspenso',
};

export const StudentDetails: React.FC<StudentDetailsProps> = ({
    student,
    isOpen,
    onClose,
    onEdit,
    onToggleStatus,
    onDelete,
    onAccessChanged,
    canManageAccess = true,
}) => {
    if (!student) return null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Detalhes do Estudante"
                size="lg"
            >
                <div className={styles.container}>
                    {/* Header com avatar e status */}
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <div className={styles.avatar}>
                                <User size={32} />
                            </div>
                            <div className={styles.headerInfo}>
                                <h2 className={styles.studentName}>{student.fullName}</h2>
                                <div className={styles.studentMeta}>
                                    <span className={styles.metaItem}>
                                        <FileText size={12} />
                                        {student.studentNumber}
                                    </span>
                                    <span className={styles.metaDivider}>•</span>
                                    <span className={styles.metaItem}>
                                        <GraduationCap size={12} />
                                        {student.currentEnrollment?.class?.name || 'Sem turma'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            {getStatusBadge(student.isActive)}
                        </div>
                    </div>

                    {/* Grid de informações estilizada */}
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
                                    <span className={styles.infoValue}>{student.fullName}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Users size={12} />
                                        Género
                                    </span>
                                    <span className={styles.infoValue}>{getGenderLabel(student.gender)}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Calendar size={12} />
                                        Data de Nascimento
                                    </span>
                                    <span className={styles.infoValue}>{formatDate(student.birthDate)}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Globe size={12} />
                                        Naturalidade
                                    </span>
                                    <span className={styles.infoValue}>{student.birthPlace || 'N/A'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Globe size={12} />
                                        Nacionalidade
                                    </span>
                                    <span className={styles.infoValue}>{student.nationality || 'N/A'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <MapPin size={12} />
                                        Província
                                    </span>
                                    <span className={styles.infoValue}>{student.province || 'N/A'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <MapPin size={12} />
                                        Distrito
                                    </span>
                                    <span className={styles.infoValue}>{student.district || 'N/A'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Home size={12} />
                                        Endereço
                                    </span>
                                    <span className={styles.infoValue}>{student.address || 'N/A'}</span>
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
                                        {student.email ? (
                                            <a href={`mailto:${student.email}`} className={styles.contactLink}>
                                                {student.email}
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
                                        {student.phone ? (
                                            <a href={`tel:${student.phone}`} className={styles.contactLink}>
                                                {student.phone}
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
                                    <span className={styles.infoValue}>{documentTypeLabel(student.documentType)}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <FileText size={12} />
                                        Número do Documento
                                    </span>
                                    <span className={styles.infoValue}>{student.documentNumber || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Família */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <Heart size={18} />
                                </div>
                                <h3 className={styles.sectionTitle}>Família</h3>
                            </div>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <User size={12} />
                                        Nome do Pai
                                    </span>
                                    <span className={styles.infoValue}>{student.fatherFullName || 'N/A'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <User size={12} />
                                        Nome da Mãe
                                    </span>
                                    <span className={styles.infoValue}>{student.motherFullName || 'N/A'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Users size={12} />
                                        Responsável
                                    </span>
                                    <span className={styles.infoValue}>{student.guardianName || 'N/A'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Phone size={12} />
                                        Telefone do Responsável
                                    </span>
                                    <span className={styles.infoValue}>{student.guardianPhone || 'N/A'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Heart size={12} />
                                        Parentesco
                                    </span>
                                    <span className={styles.infoValue}>{student.guardianRelationship || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Dados Académicos */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <GraduationCap size={18} />
                                </div>
                                <h3 className={styles.sectionTitle}>Dados Académicos</h3>
                            </div>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Calendar size={12} />
                                        Data de Admissão
                                    </span>
                                    <span className={styles.infoValue}>{formatDate(student.admissionDate)}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <Briefcase size={12} />
                                        Status do Estudante
                                    </span>
                                    <span className={styles.infoValue}>
                                        <Badge variant="neutral" size="sm">
                                            {STUDENT_STATUS_LABELS[student.studentStatus || 'ACTIVE'] ?? student.studentStatus}
                                        </Badge>
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <GraduationCap size={12} />
                                        Turma Atual
                                    </span>
                                    <span className={styles.infoValue}>
                                        {student.currentEnrollment?.class?.name || '-'}
                                        {student.currentEnrollment?.grade?.name && (
                                            <span className={styles.infoSubtext}>
                                                ({student.currentEnrollment.grade.name})
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>
                                        <CheckCircle size={12} />
                                        Matrícula Ativa
                                    </span>
                                    <span className={styles.infoValue}>
                                        {student.currentEnrollment ? (
                                            <Badge variant="success" size="sm">
                                                <CheckCircle size={10} />
                                                Sim
                                            </Badge>
                                        ) : (
                                            <Badge variant="warning" size="sm">
                                                <XCircle size={10} />
                                                Não
                                            </Badge>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <SystemAccessSection
                            access={student.user}
                            personActive={student.isActive}
                            personNoun="estudante"
                            canManage={canManageAccess}
                            onCreate={() => studentService.createUser(student.uuid)}
                            onResetPassword={() => studentService.resetPassword(student.uuid)}
                            onSetActive={isActive => studentService.setAccessStatus(student.uuid, isActive)}
                            onChanged={() => onAccessChanged?.()}
                        />
                    </div>

                    {/* Footer com ações */}
                    <div className={styles.footer}>
                        <div className={styles.footerLeft}>
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                icon={<X size={18} />}
                            >
                                Fechar
                            </Button>
                        </div>
                        <div className={styles.footerRight}>
                            {onToggleStatus && (
                                <Button
                                    variant={student.isActive ? 'warning' : 'success'}
                                    onClick={onToggleStatus}
                                    icon={student.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                                >
                                    {student.isActive ? 'Desativar' : 'Ativar'}
                                </Button>
                            )}
                            {onEdit && (
                                <Button
                                    variant="primary"
                                    onClick={onEdit}
                                    icon={<Edit size={18} />}
                                >
                                    Editar
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="danger"
                                    onClick={onDelete}
                                    icon={<Trash2 size={18} />}
                                >
                                    Excluir
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

        </>
    );
};