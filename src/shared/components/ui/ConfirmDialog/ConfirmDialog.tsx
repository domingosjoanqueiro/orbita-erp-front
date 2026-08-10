'use client';

import React from 'react';
import { AlertTriangle, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '../Button/Button';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={24} className={styles.iconDanger} />;
      case 'warning':
        return <AlertCircle size={24} className={styles.iconWarning} />;
      case 'info':
        return <AlertCircle size={24} className={styles.iconInfo} />;
      default:
        return <AlertTriangle size={24} className={styles.iconDanger} />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'primary';
      default:
        return 'danger';
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={18} />
        </button>

        <div className={styles.content}>
          <div className={styles.iconWrapper}>{getIcon()}</div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={onClose}
            icon={<X size={16} />}
          >
            {cancelText}
          </Button>
          <Button
            variant={getButtonVariant()}
            onClick={onConfirm}
            isLoading={isLoading}
            icon={type === 'danger' ? <AlertTriangle size={16} /> : <Check size={16} />}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};