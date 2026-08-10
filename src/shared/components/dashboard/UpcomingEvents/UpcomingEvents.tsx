'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  ArrowUpRight,
  Bell,
  BellOff,
  ChevronRight,
  Star,
} from 'lucide-react';
import styles from './UpcomingEvents.module.css';

export interface Event {
  id: string | number;
  title: string;
  date: string;
  time: string;
  type: 'meeting' | 'deadline' | 'event' | 'holiday' | 'task';
  location?: string;
  isVirtual?: boolean;
  participants?: number;
  isNotified?: boolean;
  isImportant?: boolean;
}

interface UpcomingEventsProps {
  events: Event[];
  onViewAll?: () => void;
  onToggleNotification?: (id: string | number) => void;
  maxItems?: number;
}

const getTypeConfig = (type: Event['type']) => {
  const configs = {
    meeting: { 
      icon: <Users size={12} />, 
      color: '#2563EB', 
      gradient: 'linear-gradient(135deg, #2563EB, #7C3AED)',
      label: 'Reunião' 
    },
    deadline: { 
      icon: <Clock size={12} />, 
      color: '#F59E0B', 
      gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)',
      label: 'Prazo' 
    },
    event: { 
      icon: <Calendar size={12} />, 
      color: '#10B981', 
      gradient: 'linear-gradient(135deg, #10B981, #34D399)',
      label: 'Evento' 
    },
    holiday: { 
      icon: <Star size={12} />, 
      color: '#EC4899', 
      gradient: 'linear-gradient(135deg, #EC4899, #F472B6)',
      label: 'Feriado' 
    },
    task: { 
      icon: <Clock size={12} />, 
      color: '#8B5CF6', 
      gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
      label: 'Tarefa' 
    },
  };
  return configs[type] || configs.event;
};

const isToday = (date: string) => {
  const today = new Date();
  const eventDate = new Date(date);
  return today.toDateString() === eventDate.toDateString();
};

const isTomorrow = (date: string) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const eventDate = new Date(date);
  return tomorrow.toDateString() === eventDate.toDateString();
};

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events,
  onViewAll,
  onToggleNotification,
  maxItems = 5,
}) => {
  const displayEvents = events.slice(0, maxItems);

  const getDateLabel = (date: string) => {
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return new Date(date).toLocaleString('pt-BR', { weekday: 'short' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Calendar size={16} />
          </div>
          <span className={styles.title}>Eventos</span>
          <span className={styles.count}>{displayEvents.length}</span>
        </div>
        {onViewAll && (
          <button className={styles.viewAll} onClick={onViewAll}>
            Ver todos <ArrowUpRight size={12} />
          </button>
        )}
      </div>

      <div className={styles.list}>
        {displayEvents.map((event) => {
          const typeConfig = getTypeConfig(event.type);
          const isTodayEvent = isToday(event.date);
          const isTomorrowEvent = isTomorrow(event.date);
          const day = new Date(event.date).getDate();
          const month = new Date(event.date).toLocaleString('pt-BR', { month: 'short' });
          const dateLabel = getDateLabel(event.date);

          return (
            <div 
              key={event.id} 
              className={`${styles.item} ${isTodayEvent ? styles.today : ''} ${event.isImportant ? styles.important : ''}`}
            >
              <div className={styles.glow} />
              
              <div className={styles.dateWrapper}>
                <div className={styles.date}>
                  <span className={styles.day}>{String(day).padStart(2, '0')}</span>
                  <span className={styles.month}>{month}</span>
                  <span className={styles.dateLabel}>{dateLabel}</span>
                </div>
                {isTodayEvent && (
                  <div className={styles.todayPulse}>
                    <span className={styles.pulseDot} />
                    <span className={styles.pulseRing} />
                  </div>
                )}
              </div>

              <div className={styles.content}>
                <div className={styles.top}>
                  <div className={styles.info}>
                    <div 
                      className={styles.typeBadge}
                      style={{ background: typeConfig.gradient }}
                    >
                      {typeConfig.icon}
                      <span>{typeConfig.label}</span>
                    </div>
                    <span className={styles.title}>{event.title}</span>
                    {event.isImportant && (
                      <span className={styles.importantBadge}>
                        <Star size={10} /> Importante
                      </span>
                    )}
                  </div>
                  <div className={styles.actions}>
                    <button 
                      className={styles.notify}
                      onClick={() => onToggleNotification?.(event.id)}
                    >
                      {event.isNotified ? (
                        <Bell size={14} className={styles.notified} />
                      ) : (
                        <BellOff size={14} />
                      )}
                    </button>
                    <button className={styles.arrowBtn}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.meta}>
                  <span className={styles.metaItem}>
                    <Clock size={10} /> {event.time}
                  </span>
                  {event.location && (
                    <span className={styles.metaItem}>
                      <MapPin size={10} /> {event.location}
                    </span>
                  )}
                  {event.isVirtual && (
                    <span className={`${styles.metaItem} ${styles.virtual}`}>
                      <Video size={10} /> Virtual
                    </span>
                  )}
                  {event.participants && (
                    <span className={styles.metaItem}>
                      <Users size={10} /> {event.participants}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayEvents.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>✨</div>
          <span className={styles.emptyTitle}>Nenhum evento</span>
          <span className={styles.emptySub}>Os eventos aparecerão aqui</span>
        </div>
      )}
    </div>
  );
};