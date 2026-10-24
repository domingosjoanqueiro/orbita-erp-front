'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, Clock, Key, Mail, Power, PowerOff, Shield, User, UserPlus, XCircle } from 'lucide-react';
import { Badge } from '@/shared/components/ui/Badge/Badge';
import { Button } from '@/shared/components/ui/Button/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog';
import { useToast } from '@/shared/contexts/ToastContext';
import { getApiErrorMessage } from '@/shared/utils/api.utils';
import { formatDisplayDate } from '@/shared/utils/date.utils';
import { CredentialsDisplay } from './CredentialsDisplay';
import styles from './PersonDetails.module.css';

export interface SystemAccess {
    uuid: string;
    username: string;
    email: string | null;
    isActive: boolean;
    mustChangePassword: boolean;
    lastLoginAt: string | null;
}

export interface AccessCredentials {
    username: string;
    temporaryPassword: string;
}

interface SystemAccessSectionProps {
    access: SystemAccess | null | undefined;
    // estado da ficha (professor/estudante); o acesso não pode ficar ativo com a ficha inativa
    personActive: boolean;
    // "professor" / "estudante"
    personNoun: string;
    canManage: boolean;
    onCreate: () => Promise<AccessCredentials>;
    onResetPassword: () => Promise<AccessCredentials>;
    onSetActive: (isActive: boolean) => Promise<unknown>;
    // recarregar a ficha depois de uma alteração
    onChanged: () => void;
}

type PendingAction = 'reset' | 'toggle' | null;

export const SystemAccessSection: React.FC<SystemAccessSectionProps> = ({
    access,
    personActive,
    personNoun,
    canManage,
    onCreate,
    onResetPassword,
    onSetActive,
    onChanged,
}) => {
    const { showSuccess, showError } = useToast();
    const [busy, setBusy] = useState(false);
    const [pending, setPending] = useState<PendingAction>(null);
    const [credentials, setCredentials] = useState<{ title: string; username: string; password: string } | null>(null);
    const personLabel = `O ${personNoun}`;

    const run = async (action: () => Promise<void>, fallback: string) => {
        try {
            setBusy(true);
            await action();
        } catch (error) {
            showError('Erro', getApiErrorMessage(error, fallback));
        } finally {
            setBusy(false);
            setPending(null);
        }
    };

    const handleCreate = () =>
        run(async () => {
            const result = await onCreate();
            setCredentials({ title: 'Acesso criado', username: result.username, password: result.temporaryPassword });
            showSuccess('Acesso criado', `O ${personNoun} já pode entrar no sistema.`);
            onChanged();
        }, 'Não foi possível criar o acesso.');

    const handleReset = () =>
        run(async () => {
            const result = await onResetPassword();
            setCredentials({ title: 'Nova senha gerada', username: result.username, password: result.temporaryPassword });
            showSuccess('Senha redefinida', 'Foi gerada uma nova senha temporária.');
            onChanged();
        }, 'Não foi possível redefinir a senha.');

    const handleToggle = () =>
        run(async () => {
            const next = !access?.isActive;
            await onSetActive(next);
            showSuccess(next ? 'Acesso ativado' : 'Acesso desativado', next ? `O ${personNoun} volta a poder entrar.` : `O ${personNoun} deixa de poder entrar.`);
            onChanged();
        }, 'Não foi possível alterar o acesso.');

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                    <Shield size={18} />
                </div>
                <h3 className={styles.sectionTitle}>Acesso ao Sistema</h3>
                {!access && canManage && (
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={handleCreate}
                        isLoading={busy}
                        disabled={busy || !personActive}
                        title={!personActive ? `Ative o ${personNoun} para criar o acesso` : undefined}
                        icon={<UserPlus size={14} />}
                        className={styles.createUserBtn}
                    >
                        Criar Acesso
                    </Button>
                )}
            </div>

            <div className={styles.infoGrid}>
                {access ? (
                    <>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>
                                <User size={12} />
                                Utilizador
                            </span>
                            <span className={styles.infoValue}>
                                <span className={styles.hasUser}>
                                    <CheckCircle size={14} />
                                    {access.username}
                                </span>
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>
                                <Mail size={12} />
                                Email do utilizador
                            </span>
                            <span className={styles.infoValue}>{access.email || 'N/A'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>
                                <Shield size={12} />
                                Estado do acesso
                            </span>
                            <span className={styles.infoValue}>
                                {access.isActive ? <Badge variant="success" size="sm">Ativo</Badge> : <Badge variant="error" size="sm">Inativo</Badge>}
                                {access.mustChangePassword && (
                                    <Badge variant="warning" size="sm">Senha temporária</Badge>
                                )}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>
                                <Clock size={12} />
                                Último acesso
                            </span>
                            <span className={styles.infoValue}>
                                {access.lastLoginAt ? formatDisplayDate(access.lastLoginAt, true) : 'Nunca entrou'}
                            </span>
                        </div>
                        {canManage && (
                            <div className={`${styles.infoItem} ${styles.userActions}`}>
                                <span className={styles.infoLabel}>Ações</span>
                                <div className={styles.userActionButtons}>
                                    <Button size="sm" variant="secondary" onClick={() => setPending('reset')} disabled={busy} icon={<Key size={14} />}>
                                        Redefinir Senha
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={access.isActive ? 'warning' : 'success'}
                                        onClick={() => setPending('toggle')}
                                        disabled={busy || (!access.isActive && !personActive)}
                                        title={!access.isActive && !personActive ? `Ative o ${personNoun} primeiro` : undefined}
                                        icon={access.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                                    >
                                        {access.isActive ? 'Desativar acesso' : 'Ativar acesso'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={`${styles.infoItem} ${styles.noUserFull}`}>
                        <span className={styles.infoLabel}>
                            <AlertCircle size={12} />
                            Estado
                        </span>
                        <span className={styles.infoValue}>
                            <span className={styles.noUser}>
                                <XCircle size={14} />
                                Sem acesso ao sistema
                            </span>
                            <span className={styles.noUserHint}>
                                {!canManage
                                    ? 'Sem permissão para criar acessos.'
                                    : personActive
                                        ? 'Clique em "Criar Acesso" para gerar as credenciais.'
                                        : `Ative o ${personNoun} para poder criar o acesso.`}
                            </span>
                        </span>
                    </div>
                )}
            </div>

            {/* Fora do modal de detalhes (sem portal ficariam presos ao conteúdo do modal) */}
            {typeof document !== 'undefined' && createPortal(
            <>
            <ConfirmDialog
                isOpen={pending !== null}
                onClose={() => setPending(null)}
                onConfirm={pending === 'reset' ? handleReset : handleToggle}
                title={pending === 'reset' ? 'Redefinir senha' : access?.isActive ? 'Desativar acesso' : 'Ativar acesso'}
                message={
                    pending === 'reset'
                        ? `Será gerada uma nova senha temporária para "${access?.username}". A senha atual deixa de funcionar.`
                        : access?.isActive
                            ? `"${access?.username}" deixa de poder entrar no sistema. A ficha do ${personNoun} mantém-se ativa.`
                            : `"${access?.username}" volta a poder entrar no sistema.`
                }
                type="warning"
                confirmText={pending === 'reset' ? 'Gerar nova senha' : access?.isActive ? 'Desativar' : 'Ativar'}
                isLoading={busy}
            />

            {credentials && (
                <CredentialsDisplay
                    title={credentials.title}
                    username={credentials.username}
                    password={credentials.password}
                    personLabel={personLabel}
                    onClose={() => setCredentials(null)}
                />
            )}
            </>,
            document.body
            )}
        </div>
    );
};
