// src/features/academic/students/components/StudentDetails.tsx

'use client';

import React, { useState } from 'react';
import {
    User,
    Mail,
    Phone,
    Calendar,
    FileText,
    MapPin,
    Globe,
    Heart,
    Shield,
    CheckCircle,
    XCircle,
    GraduationCap,
    Building,
    Clock,
    Edit,
    Trash2,
    Power,
    PowerOff,
    X,
    IdCard,
    Home,
    Users,
    Briefcase,
    Key,
    UserPlus,
    Copy,
    Check,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Modal } from '@/shared/components/ui/Modal/Modal';
import { Input } from '@/shared/components/ui/Input/Input';
import { useToast } from '@/shared/contexts/ToastContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
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
    onUserCreated?: () => void;
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

const formatDate = (date: string | undefined | null): string => {
    if (!date) return 'N/A';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return 'N/A';
    }
};

const formatDateTime = (date: string | undefined | null): string => {
    if (!date) return 'N/A';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return 'N/A';
    }
};

// ✅ Componente para exibir credenciais do usuário criado
const CredentialsDisplay: React.FC<{
    username: string;
    password: string;
    onClose: () => void;
}> = ({ username, password, onClose }) => {
    const [copied, setCopied] = useState<'username' | 'password' | null>(null);

    const handleCopy = async (text: string, type: 'username' | 'password') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch (error) {
            console.error('Erro ao copiar:', error);
        }
    };

    return (
        <div className={styles.credentialsOverlay}>
            <div className={styles.credentialsCard}>
                <div className={styles.credentialsSuccess}>
                    <CheckCircle size={48} className={styles.credentialsSuccessIcon} />
                    <h3 className={styles.credentialsTitle}>Acesso Criado com Sucesso!</h3>
                    <p className={styles.credentialsSubtitle}>
                        As credenciais de acesso foram geradas. Guarde-as em local seguro.
                    </p>
                </div>

                <div className={styles.credentialsItems}>
                    <div className={styles.credentialsItem}>
                        <div className={styles.credentialsItemLabel}>
                            <User size={14} />
                            <span>Utilizador</span>
                        </div>
                        <div className={styles.credentialsItemValue}>
                            <span className={styles.credentialsValue}>{username}</span>
                            <button
                                className={styles.credentialsCopyBtn}
                                onClick={() => handleCopy(username, 'username')}
                                title="Copiar utilizador"
                            >
                                {copied === 'username' ? (
                                    <Check size={16} className={styles.credentialsCopied} />
                                ) : (
                                    <Copy size={16} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className={styles.credentialsItem}>
                        <div className={styles.credentialsItemLabel}>
                            <Key size={14} />
                            <span>Senha Temporária</span>
                        </div>
                        <div className={styles.credentialsItemValue}>
                            <span className={styles.credentialsValue}>{password}</span>
                            <button
                                className={styles.credentialsCopyBtn}
                                onClick={() => handleCopy(password, 'password')}
                                title="Copiar senha"
                            >
                                {copied === 'password' ? (
                                    <Check size={16} className={styles.credentialsCopied} />
                                ) : (
                                    <Copy size={16} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.credentialsWarning}>
                    <AlertCircle size={16} />
                    <span>O estudante deverá alterar a senha no primeiro acesso.</span>
                </div>

                <Button
                    variant="primary"
                    onClick={onClose}
                    className={styles.credentialsCloseBtn}
                    fullWidth
                >
                    Entendi, continuar
                </Button>
            </div>
        </div>
    );
};

export const StudentDetails: React.FC<StudentDetailsProps> = ({
    student,
    isOpen,
    onClose,
    onEdit,
    onToggleStatus,
    onDelete,
    onUserCreated,
}) => {
    const { showSuccess, showError } = useToast();
    const { startLoading, stopLoading } = useLoading();
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [newCredentials, setNewCredentials] = useState<{ username: string; password: string } | null>(null);

    if (!student) return null;

    const hasUser = !!student.userId;
    const isUserActive = student.isActive ?? false;

    // ✅ Função para criar acesso ao sistema
    const handleCreateUser = async () => {
        if (!student) return;

        try {
            setIsCreatingUser(true);
            startLoading();

            const response = await studentService.createUser(student.uuid);

            if (response) {
                setNewCredentials({
                    username: response.username,
                    password: response.temporaryPassword || 'Senha temporária',
                });
                setShowCredentials(true);
                showSuccess('Acesso criado', 'Usuário criado com sucesso!');

                if (onUserCreated) {
                    onUserCreated();
                }
            }
        } catch (error: any) {
            console.error('Erro ao criar usuário:', error);
            const message = error.response?.data?.message || 'Erro ao criar acesso ao sistema.';
            showError('Erro', message);
        } finally {
            setIsCreatingUser(false);
            stopLoading();
        }
    };

    // ✅ Função para redefinir senha
    const handleResetPassword = async () => {
        if (!student || !student.user) return;

        try {
            startLoading();
            const response = await studentService.resetPassword(student.user.uuid);

            if (response) {
                setNewCredentials({
                    username: student.user?.username || '',
                    password: response.temporaryPassword || 'Nova senha temporária',
                });
                setShowCredentials(true);
                showSuccess('Senha redefinida', 'Nova senha temporária gerada com sucesso!');
            }
        } catch (error: any) {
            console.error('Erro ao redefinir senha:', error);
            const message = error.response?.data?.message || 'Erro ao redefinir senha.';
            showError('Erro', message);
        } finally {
            stopLoading();
        }
    };

    // ✅ Função para ativar/desativar usuário
    const handleToggleUserStatus = async () => {
        if (!student || !student.user) return;

        try {
            startLoading();
            await studentService.toggleUserStatus(student.user.uuid, !isUserActive);

            const newStatus = isUserActive ? 'desativado' : 'ativado';
            showSuccess(`Usuário ${newStatus}`, `Usuário ${newStatus} com sucesso!`);

            if (onUserCreated) {
                onUserCreated();
            }
        } catch (error: any) {
            console.error('Erro ao alterar status do usuário:', error);
            const message = error.response?.data?.message || 'Erro ao alterar status do usuário.';
            showError('Erro', message);
        } finally {
            stopLoading();
        }
    };

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
                                    <span className={styles.infoValue}>{student.documentType || 'N/A'}</span>
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
                                            {student.studentStatus || 'ACTIVE'}
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

                        {/* ✅ Acesso ao Sistema - COM AÇÕES */}
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <Shield size={18} />
                                </div>
                                <h3 className={styles.sectionTitle}>Acesso ao Sistema</h3>
                                {!hasUser && (
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={handleCreateUser}
                                        isLoading={isCreatingUser}
                                        icon={<UserPlus size={14} />}
                                        className={styles.createUserBtn}
                                    >
                                        Criar Acesso
                                    </Button>
                                )}
                            </div>
                            <div className={styles.infoGrid}>
                                {hasUser ? (
                                    <>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>
                                                <User size={12} />
                                                Usuário
                                            </span>
                                            <span className={styles.infoValue}>
                                                <span className={styles.hasUser}>
                                                    <CheckCircle size={14} />
                                                    {student.user?.username}
                                                </span>
                                            </span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>
                                                <Mail size={12} />
                                                Email do Usuário
                                            </span>
                                            <span className={styles.infoValue}>{student.email || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>
                                                <Shield size={12} />
                                                Status do Usuário
                                            </span>
                                            <span className={styles.infoValue}>
                                                {student.isActive ? (
                                                    <Badge variant="success" size="sm">Ativo</Badge>
                                                ) : (
                                                    <Badge variant="error" size="sm">Inativo</Badge>
                                                )}
                                            </span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>
                                                <Clock size={12} />
                                                Criado em
                                            </span>
                                            <span className={styles.infoValue}>
                                                <Clock size={14} />
                                                {formatDateTime(student.createdAt)}
                                            </span>
                                        </div>
                                        {/* ✅ Ações do usuário */}
                                        <div className={`${styles.infoItem} ${styles.userActions}`}>
                                            <span className={styles.infoLabel}>Ações</span>
                                            <div className={styles.userActionButtons}>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={handleResetPassword}
                                                    icon={<Key size={14} />}
                                                >
                                                    Redefinir Senha
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={student.user?.isActive ? 'warning' : 'success'}
                                                    onClick={handleToggleUserStatus}
                                                    icon={student.user?.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                                                >
                                                    {student.user?.isActive ? 'Desativar' : 'Ativar'}
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className={`${styles.infoItem} ${styles.noUserFull}`}>
                                        <span className={styles.infoLabel}>
                                            <AlertCircle size={12} />
                                            Status
                                        </span>
                                        <span className={styles.infoValue}>
                                            <span className={styles.noUser}>
                                                <XCircle size={14} />
                                                Sem acesso ao sistema
                                            </span>
                                            <span className={styles.noUserHint}>
                                                Clique em "Criar Acesso" para gerar credenciais
                                            </span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
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

            {/* ✅ Modal de credenciais */}
            {showCredentials && newCredentials && (
                <CredentialsDisplay
                    username={newCredentials.username}
                    password={newCredentials.password}
                    onClose={() => {
                        setShowCredentials(false);
                        setNewCredentials(null);
                        if (onUserCreated) {
                            onUserCreated();
                        }
                    }}
                />
            )}
        </>
    );
};