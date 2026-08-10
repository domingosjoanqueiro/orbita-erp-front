'use client';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { getErrorMessage, type FormError } from '@/shared/types/form.types';
import styles from './Select.module.css';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: FormError;
  options: Option[];
  fullWidth?: boolean;
  placeholder?: string;
  leftIcon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, fullWidth, placeholder, leftIcon, className = '', ...props }, ref) => {
    const errorMessage = getErrorMessage(error);

    return (
      <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.selectWrapper}>
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
          <select
            ref={ref}
            className={[
              styles.select,
              errorMessage && styles.error,
              leftIcon && styles.hasLeftIcon,
              fullWidth && styles.fullWidth,
              className,
            ].filter(Boolean).join(' ')}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className={styles.icon} />
        </div>
        {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';