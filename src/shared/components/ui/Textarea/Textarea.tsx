// src/shared/components/ui/Textarea/Textarea.tsx

'use client';

import React, { forwardRef } from 'react';
import { getErrorMessage, type FormError } from '@/shared/types/form.types';
import styles from './Textarea.module.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: FormError;
  fullWidth?: boolean;
  rows?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    label, 
    error, 
    fullWidth, 
    rows = 4, 
    className = '', 
    leftIcon,
    rightIcon,
    ...props 
  }, ref) => {
    const errorMessage = getErrorMessage(error);

    const wrapperClasses = [
      styles.wrapper,
      fullWidth && styles.fullWidth,
    ].filter(Boolean).join(' ');

    const textareaClasses = [
      styles.textarea,
      errorMessage && styles.error,
      fullWidth && styles.fullWidth,
      leftIcon && styles.hasLeftIcon,
      rightIcon && styles.hasRightIcon,
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={wrapperClasses}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.inputWrapper}>
          {leftIcon && (
            <span className={styles.leftIcon}>
              {leftIcon}
            </span>
          )}
          <textarea
            ref={ref}
            className={textareaClasses}
            rows={rows}
            {...props}
          />
          {rightIcon && (
            <span className={styles.rightIcon}>
              {rightIcon}
            </span>
          )}
        </div>
        {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';