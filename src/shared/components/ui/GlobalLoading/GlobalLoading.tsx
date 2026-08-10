'use client';

import React from 'react';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { Loading } from '../Loading/Loading';
import styles from './GlobalLoading.module.css';

export const GlobalLoading: React.FC = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className={styles.globalLoading}>
      <Loading size="lg" overlay fullScreen />
    </div>
  );
};