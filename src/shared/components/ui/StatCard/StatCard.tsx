'use client';

import React from 'react';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink' | 'teal';
  subtitle?: string;
  loading?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  subtitle,
  loading = false,
  onClick,
}) => {
  const isPositive = trend ? trend.value > 0 : false;
  const isZero = trend ? trend.value === 0 : false;

  const getTrendIcon = () => {
    if (isZero) return <Minus size={12} />;
    return isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />;
  };

  const getTrendColor = () => {
    if (isZero) return styles.neutral;
    return isPositive ? styles.positive : styles.negative;
  };

  if (loading) {
    return (
      <div className={`${styles.card} ${styles[color]} ${styles.loading}`}>
        <div className={styles.shimmer} />
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <div className={styles.iconPlaceholder} />
        </div>
        <div className={styles.valuePlaceholder} />
        <div className={styles.trendPlaceholder} />
      </div>
    );
  }

  return (
    <div 
      className={`${styles.card} ${styles[color]} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
    >
      {/* Glow effect */}
      <div className={styles.glow} />
      
      {/* Decorative line */}
      <div className={styles.decorativeLine} />

      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <span className={styles.title}>{title}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
        {icon && (
          <div className={`${styles.iconWrapper} ${styles[color]}`}>
            <span className={styles.icon}>{icon}</span>
          </div>
        )}
      </div>

      <div className={styles.valueWrapper}>
        <span className={styles.value}>{value}</span>
        {trend && (
          <div className={`${styles.trend} ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className={styles.trendValue}>
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>

      {trend && (
        <div className={styles.trendLabel}>
          <span>{trend.label}</span>
        </div>
      )}
    </div>
  );
};