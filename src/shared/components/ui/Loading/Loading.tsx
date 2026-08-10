'use client';

import React from 'react';
import styles from './Loading.module.css';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  overlay?: boolean;
  text?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  overlay = false,
  text = 'Carregando...',
  fullScreen = false,
}) => {
  const loadingContent = (
    <div className={`${styles.loading} ${styles[size]}`}>
      <div className={styles.spinnerContainer}>
        <div className={styles.spinner}>
          <div className={styles.circle}></div>
          <div className={styles.circle}></div>
          <div className={styles.circle}></div>
          <div className={styles.circle}></div>
        </div>
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className={`${styles.overlay} ${fullScreen ? styles.fullScreen : ''}`}>
        {loadingContent}
      </div>
    );
  }

  return loadingContent;
};