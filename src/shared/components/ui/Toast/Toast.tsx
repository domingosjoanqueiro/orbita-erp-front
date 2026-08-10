'use client';

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  Check,
  AlertTriangle 
} from 'lucide-react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={20} className={styles.iconSuccess} />;
    case 'error':
      return <XCircle size={20} className={styles.iconError} />;
    case 'warning':
      return <AlertTriangle size={20} className={styles.iconWarning} />;
    case 'info':
      return <Info size={20} className={styles.iconInfo} />;
  }
};

const getTypeClass = (type: ToastType) => {
  switch (type) {
    case 'success':
      return styles.toastSuccess;
    case 'error':
      return styles.toastError;
    case 'warning':
      return styles.toastWarning;
    case 'info':
      return styles.toastInfo;
  }
};

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(message.id), 300);
    }, message.duration || 5000);

    return () => clearTimeout(timer);
  }, [message.id, message.duration, onClose]);

  return (
    <div 
      className={`${styles.toast} ${getTypeClass(message.type)} ${isExiting ? styles.exiting : ''}`}
      role="alert"
    >
      <div className={styles.iconWrapper}>
        {getIcon(message.type)}
      </div>
      <div className={styles.content}>
        <span className={styles.title}>{message.title}</span>
        {message.message && (
          <span className={styles.message}>{message.message}</span>
        )}
      </div>
      <button 
        className={styles.closeButton}
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(message.id), 300);
        }}
      >
        <X size={16} />
      </button>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ animationDuration: `${message.duration || 5000}ms` }}
        />
      </div>
    </div>
  );
};