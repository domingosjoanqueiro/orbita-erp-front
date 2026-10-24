'use client';

import React, { useState } from 'react';
import { AlertCircle, Check, CheckCircle, Copy, Key, User } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button/Button';
import styles from './PersonDetails.module.css';

interface CredentialsDisplayProps {
    title: string;
    username: string;
    password: string;
    // ex.: "O professor" / "O estudante"
    personLabel: string;
    onClose: () => void;
}

// Credenciais geradas (criação do acesso ou nova senha), para copiar e entregar
export const CredentialsDisplay: React.FC<CredentialsDisplayProps> = ({
    title,
    username,
    password,
    personLabel,
    onClose,
}) => {
    const [copied, setCopied] = useState<'username' | 'password' | null>(null);

    const handleCopy = async (text: string, type: 'username' | 'password') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch {
            // sem acesso à área de transferência: o texto continua visível
        }
    };

    return (
        <div className={styles.credentialsOverlay} role="dialog" aria-modal="true" aria-label={title}>
            <div className={styles.credentialsCard}>
                <div className={styles.credentialsSuccess}>
                    <CheckCircle size={48} className={styles.credentialsSuccessIcon} />
                    <h3 className={styles.credentialsTitle}>{title}</h3>
                    <p className={styles.credentialsSubtitle}>
                        Guarde estas credenciais e entregue-as em mão. A senha não volta a ser mostrada.
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
                                type="button"
                                className={styles.credentialsCopyBtn}
                                onClick={() => handleCopy(username, 'username')}
                                title="Copiar utilizador"
                            >
                                {copied === 'username' ? <Check size={16} className={styles.credentialsCopied} /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className={styles.credentialsItem}>
                        <div className={styles.credentialsItemLabel}>
                            <Key size={14} />
                            <span>Senha temporária</span>
                        </div>
                        <div className={styles.credentialsItemValue}>
                            <span className={styles.credentialsValue}>{password}</span>
                            <button
                                type="button"
                                className={styles.credentialsCopyBtn}
                                onClick={() => handleCopy(password, 'password')}
                                title="Copiar senha"
                            >
                                {copied === 'password' ? <Check size={16} className={styles.credentialsCopied} /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.credentialsWarning}>
                    <AlertCircle size={16} />
                    <span>{personLabel} terá de alterar a senha no primeiro acesso.</span>
                </div>

                <Button variant="primary" onClick={onClose} className={styles.credentialsCloseBtn} fullWidth>
                    Entendi, continuar
                </Button>
            </div>
        </div>
    );
};
