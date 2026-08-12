'use client';

import React, { forwardRef } from 'react';
import { getErrorMessage, type FormError } from '@/shared/types/form.types';
import styles from './Textarea.module.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: FormError;
  fullWidth?: boolean;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth, rows = 4, className = '', ...props }, ref) => {
    const errorMessage = getErrorMessage(error);

    const textareaClasses = [
      styles.textarea,
      errorMessage && styles.error,
      fullWidth && styles.fullWidth,
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`}>
        {label && <label className={styles.label}>{label}</label>}
        <textarea
          ref={ref}
          className={textareaClasses}
          rows={rows}
          {...props}
        />
        {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';