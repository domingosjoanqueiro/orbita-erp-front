'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Clock,
  BarChart3,
  SquareActivity,
  Zap,
  Award,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { StatCard } from '@/shared/components/ui/StatCard/StatCard';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import { RecentActivities } from '@/shared/components/dashboard/RecentActivities/RecentActivities';
import { UpcomingEvents } from '@/shared/components/dashboard/UpcomingEvents/UpcomingEvents';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { useAuth } from '@/shared/contexts/AuthContext';
import { companyDashboardService } from '@/features/dashboard/services/dashboard.service';
import type { Activity } from '@/shared/components/dashboard/RecentActivities/RecentActivities';
import type { Event } from '@/shared/components/dashboard/UpcomingEvents/UpcomingEvents';
import type { CompanyDashboardStats } from '@/features/dashboard/types/dashboard.types';
import styles from './page.module.css';

// Quick Actions
const quickActions = [
  { label: 'Novo Aluno', icon: <Users size={16} />, color: '#2563EB' },
  { label: 'Nova Matrícula', icon: <BookOpen size={16} />, color: '#10B981' },
  { label: 'Lançar Notas', icon: <BarChart3 size={16} />, color: '#F59E0B' },
  { label: 'Relatórios', icon: <SquareActivity size={16} />, color: '#8B5CF6' },
];

export default function DashboardPage() {
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showError } = useToast();
  const { user } = useAuth();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<CompanyDashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

const loadDashboardData = async () => {
  try {
    startLoading();
    
    const [statsResponse, activitiesResponse, eventsResponse] = await Promise.all([
      companyDashboardService.getStats(),
      companyDashboardService.getActivities(),
      companyDashboardService.getEvents(),
    ]);

    console.log('📊 Raw Stats:', statsResponse);
    console.log('📊 Raw Activities:', activitiesResponse);
    console.log('📊 Raw Events:', eventsResponse);

    // Extrair os dados da resposta - USANDO TYPE ASSERTION para evitar erros de tipagem
    const statsData = (statsResponse as any)?.data || statsResponse;
    const activitiesArray = (activitiesResponse as any)?.data || activitiesResponse || [];
    const eventsArray = (eventsResponse as any)?.data || eventsResponse || [];

    console.log('📊 Stats Data:', statsData);
    console.log('📊 Activities Array:', activitiesArray);
    console.log('📊 Events Array:', eventsArray);

    setStats(statsData);
    
    // Formatar activities
    const formattedActivities: Activity[] = activitiesArray.map((act: any) => ({
      id: act.id || Math.random().toString(36).substring(2, 9),
      type: act.type || 'system',
      title: act.title || 'Atividade',
      time: act.time || 'Agora',
      status: act.status || 'info',
    }));
    console.log('✅ Formatted Activities:', formattedActivities);
    setActivities(formattedActivities);
    
    // Formatar events
    const formattedEvents: Event[] = eventsArray.map((evt: any) => ({
      id: evt.id || Math.random().toString(36).substring(2, 9),
      title: evt.title || 'Evento',
      date: evt.date ? new Date(evt.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: evt.time || '00:00',
      type: evt.type || 'event',
      location: evt.location || '',
      participants: evt.participants || 0,
      isVirtual: evt.isVirtual || false,
      isNotified: evt.isNotified || false,
      isImportant: evt.isImportant || false,
    }));
    console.log('✅ Formatted Events:', formattedEvents);
    setEvents(formattedEvents);
    
    setLastUpdated(new Date());
    setIsVisible(true);
  } catch (error: any) {
    console.error('❌ Erro ao carregar dashboard:', error);
    showError('Erro', 'Não foi possível carregar os dados do dashboard');
  } finally {
    stopLoading();
  }
};

  useEffect(() => {
    loadDashboardData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Carregando...</p>
          </div>
        </div>
        <div className={styles.statsGrid}>
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} variant="stat" />
          ))}
        </div>
        <div className={styles.mainGrid}>
          <SkeletonCard variant="default" />
          <SkeletonCard variant="default" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.dashboard} ${isVisible ? styles.visible : ''}`}>
      {/* Header Premium */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.greetingWrapper}>
            <div className={styles.greetingIcon}>
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className={styles.title}>
                {getGreeting()}, {user?.firstName || 'Usuário'}! 👋
              </h1>
              <p className={styles.subtitle}>
                {currentTime.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.headerStats}>
            <div className={styles.headerStat}>
              <span className={styles.headerStatLabel}>Última atualização</span>
              <span className={styles.headerStatValue}>
                <Clock size={14} />
                {lastUpdated.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
          <button className={styles.refreshButton} onClick={handleRefresh}>
            <Zap size={16} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Stats Grid com animação */}
      <div className={styles.statsGrid}>
        <div className={styles.statItem} style={{ animationDelay: '0.1s' }}>
          <StatCard
            title="Alunos"
            value={formatNumber(stats?.totalStudents || 0)}
            icon={<Users size={24} />}
            trend={{ value: stats?.trends?.students || 0, label: 'vs mês' }}
            color="blue"
            subtitle={`+${stats?.newStudentsThisMonth || 0} este mês`}
          />
        </div>
        <div className={styles.statItem} style={{ animationDelay: '0.2s' }}>
          <StatCard
            title="Professores"
            value={formatNumber(stats?.totalTeachers || 0)}
            icon={<GraduationCap size={24} />}
            trend={{ value: stats?.trends?.teachers || 0, label: 'vs mês' }}
            color="green"
            subtitle={`+${stats?.newTeachersThisMonth || 0} este mês`}
          />
        </div>
        <div className={styles.statItem} style={{ animationDelay: '0.3s' }}>
          <StatCard
            title="Matrículas Ativas"
            value={formatNumber(stats?.activeEnrollments || 0)}
            icon={<BookOpen size={24} />}
            trend={{ value: stats?.trends?.enrollments || 0, label: 'vs mês' }}
            color="purple"
            subtitle={`${stats?.totalEnrollments || 0} total`}
          />
        </div>
        <div className={styles.statItem} style={{ animationDelay: '0.4s' }}>
          <StatCard
            title="Aprovação"
            value={`${stats?.approvalRate || 0}%`}
            icon={<TrendingUp size={24} />}
            trend={{ value: stats?.trends?.approvalRate || 0, label: 'vs mês' }}
            color="orange"
            subtitle="Taxa de aprovação"
          />
        </div>
      </div>

      {/* Achievements / Progress Section */}
      <div className={styles.achievements}>
        <div className={styles.achievementsHeader}>
          <span className={styles.achievementsTitle}>
            <Award size={16} />
            Progresso
          </span>
          <button className={styles.achievementsView}>
            Ver detalhes <ChevronRight size={14} />
          </button>
        </div>
        <div className={styles.achievementsGrid}>
          <div className={styles.achievementItem}>
            <div className={styles.achievementLabel}>
              <span>Meta de alunos</span>
              <span className={styles.achievementPercent}>
                {stats?.totalStudents ? Math.min(Math.round((stats.totalStudents / 1000) * 100), 100) : 0}%
              </span>
            </div>
            <div className={styles.achievementBar}>
              <div 
                className={styles.achievementFill}
                style={{ 
                  width: `${stats?.totalStudents ? Math.min(Math.round((stats.totalStudents / 1000) * 100), 100) : 0}%`,
                  background: 'linear-gradient(90deg, #2563EB, #2563EBdd)'
                }}
              />
            </div>
          </div>
          <div className={styles.achievementItem}>
            <div className={styles.achievementLabel}>
              <span>Taxa de retenção</span>
              <span className={styles.achievementPercent}>
                {stats?.approvalRate || 0}%
              </span>
            </div>
            <div className={styles.achievementBar}>
              <div 
                className={styles.achievementFill}
                style={{ 
                  width: `${stats?.approvalRate || 0}%`,
                  background: 'linear-gradient(90deg, #10B981, #10B981dd)'
                }}
              />
            </div>
          </div>
          <div className={styles.achievementItem}>
            <div className={styles.achievementLabel}>
              <span>Matrículas ativas</span>
              <span className={styles.achievementPercent}>
                {stats?.totalEnrollments ? Math.min(Math.round((stats.activeEnrollments / stats.totalEnrollments) * 100), 100) : 0}%
              </span>
            </div>
            <div className={styles.achievementBar}>
              <div 
                className={styles.achievementFill}
                style={{ 
                  width: `${stats?.totalEnrollments ? Math.min(Math.round((stats.activeEnrollments / stats.totalEnrollments) * 100), 100) : 0}%`,
                  background: 'linear-gradient(90deg, #8B5CF6, #8B5CF6dd)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <div className={styles.quickActionsHeader}>
          <span className={styles.quickActionsTitle}>
            <Zap size={16} />
            Ações Rápidas
          </span>
        </div>
        <div className={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <button 
              key={index} 
              className={styles.quickAction}
              style={{ 
                animationDelay: `${0.1 + index * 0.05}s`,
                borderColor: `${action.color}33`
              }}
            >
              <div className={styles.quickActionIcon} style={{ color: action.color }}>
                {action.icon}
              </div>
              <span className={styles.quickActionLabel}>{action.label}</span>
              <ArrowUpRight size={12} className={styles.quickActionArrow} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        <div className={styles.gridItem} style={{ animationDelay: '0.5s' }}>
          <RecentActivities
            activities={activities}
            onViewAll={() => console.log('Ver todas')}
          />
        </div>
        <div className={styles.gridItem} style={{ animationDelay: '0.6s' }}>
          <UpcomingEvents
            events={events}
            onViewAll={() => console.log('Ver todos')}
            onToggleNotification={(id) => console.log('Toggle:', id)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.footerText}>
          © 2024 Orbita ERP — Feito com <Heart size={12} className={styles.heart} /> para você
        </span>
        <span className={styles.footerVersion}>v2.0.1</span>
      </div>
    </div>
  );
}