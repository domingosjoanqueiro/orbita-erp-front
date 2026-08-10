'use client';

import React from 'react';
import { Skeleton } from './Skeletont';
import styles from './SkeletonCard.module.css';

interface SkeletonCardProps {
  variant?: 'default' | 'stat' | 'table';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ variant = 'default' }) => {
  if (variant === 'stat') {
    return (
      <div className={styles.statCard}>
        <Skeleton width="100px" height="16px" />
        <Skeleton width="60px" height="32px" />
        <Skeleton width="80px" height="14px" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={styles.tableSkeleton}>
        <div className={styles.tableHeader}>
          <Skeleton width="120px" height="20px" />
          <Skeleton width="100px" height="20px" />
          <Skeleton width="80px" height="20px" />
          <Skeleton width="60px" height="20px" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={styles.tableRow}>
            <Skeleton width="100px" height="16px" />
            <Skeleton width="120px" height="16px" />
            <Skeleton width="80px" height="16px" />
            <Skeleton width="60px" height="16px" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Skeleton width="60%" height="24px" />
        <Skeleton width="20%" height="16px" />
      </div>
      <div className={styles.cardContent}>
        <Skeleton width="100%" height="12px" />
        <Skeleton width="90%" height="12px" />
        <Skeleton width="80%" height="12px" />
      </div>
    </div>
  );
};