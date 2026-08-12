'use client';

import React, { forwardRef } from 'react';
import { getErrorMessage, type FormError } from '@/shared/types/form.types';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: FormError;
  helpText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helpText,
    fullWidth, 
    leftIcon, 
    rightIcon, 
    className = '', 
    ...props 
  }, ref) => {
    const errorMessage = getErrorMessage(error);

    const inputClasses = [
      styles.input,
      errorMessage && styles.error,
      leftIcon && styles.hasLeftIcon,
      rightIcon && styles.hasRightIcon,
      fullWidth && styles.fullWidth,
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.inputWrapper}>
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
          <input ref={ref} className={inputClasses} {...props} />
          {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
        </div>
        {helpText && !errorMessage && (
          <span className={styles.helpText}>{helpText}</span>
        )}
        {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';