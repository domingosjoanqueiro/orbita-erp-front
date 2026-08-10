'use client';

import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowUpRight,
  UserPlus,
  UserCheck,
  BookOpen,
  DollarSign,
  Sparkles,
  MoreHorizontal
} from 'lucide-react';
import styles from './RecentActivities.module.css';

export interface Activity {
  id: string | number;
  type: 'student' | 'teacher' | 'enrollment' | 'grade' | 'payment' | 'system';
  title: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface RecentActivitiesProps {
  activities: Activity[];
  onViewAll?: () => void;
  maxItems?: number;
}

const getTypeConfig = (type: Activity['type']) => {
  const configs = {
    student: { icon: <UserPlus size={14} />, color: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)' },
    teacher: { icon: <UserCheck size={14} />, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
    enrollment: { icon: <BookOpen size={14} />, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
    grade: { icon: <CheckCircle size={14} />, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' },
    payment: { icon: <DollarSign size={14} />, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
    system: { icon: <Sparkles size={14} />, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' },
  };
  return configs[type] || configs.system;
};

const getStatusConfig = (status: Activity['status']) => {
  const configs = {
    success: { icon: <CheckCircle size={12} />, color: '#10B981' },
    warning: { icon: <AlertCircle size={12} />, color: '#F59E0B' },
    error: { icon: <XCircle size={12} />, color: '#EF4444' },
    info: { icon: <AlertCircle size={12} />, color: '#2563EB' },
  };
  return configs[status];
};

export const RecentActivities: React.FC<RecentActivitiesProps> = ({
  activities,
  onViewAll,
  maxItems = 5,
}) => {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Clock size={16} />
          </div>
          <span className={styles.title}>Atividades</span>
          <span className={styles.count}>{displayActivities.length}</span>
        </div>
        {onViewAll && (
          <button className={styles.viewAll} onClick={onViewAll}>
            Ver todas <ArrowUpRight size={12} />
          </button>
        )}
      </div>

      <div className={styles.list}>
        {displayActivities.map((activity, index) => {
          const typeConfig = getTypeConfig(activity.type);
          const statusConfig = getStatusConfig(activity.status);
          
          return (
            <div key={activity.id} className={styles.item}>
              <div className={styles.itemLeft}>
                <div 
                  className={styles.iconWrapper}
                  style={{ background: typeConfig.bg, color: typeConfig.color }}
                >
                  {typeConfig.icon}
                </div>
                <div className={styles.content}>
                  <span className={styles.titleText}>{activity.title}</span>
                  <span className={styles.time}>
                    <Clock size={10} /> {activity.time}
                  </span>
                </div>
              </div>
              <div className={styles.itemRight}>
                <span className={styles.statusDot} style={{ color: statusConfig.color }}>
                  {statusConfig.icon}
                </span>
                <button className={styles.moreBtn}>
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {displayActivities.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>✨</div>
          <span className={styles.emptyTitle}>Nenhuma atividade</span>
          <span className={styles.emptySub}>As atividades aparecerão aqui</span>
        </div>
      )}
    </div>
  );
};