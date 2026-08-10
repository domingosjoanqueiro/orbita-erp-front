'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  Mail,
  Globe,
  Crown,
  Sparkles,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  GraduationCap, // Adicionar este import
} from 'lucide-react';
import { usePlatformAuth } from '@/shared/contexts/PlatformAuthContext';
import { useLoading } from '@/shared/contexts/LoadingContext';
import { useToast } from '@/shared/contexts/ToastContext';
import { platformDashboardService } from '@/features/platform/services/dashboard.service';
import { SkeletonCard } from '@/shared/components/ui/Skeleton/SkeletonCard';
import type { PlatformStats, PlatformActivity } from '@/features/platform/types/dashboard.types';
import styles from './page.module.css';

export default function SuperAdminDashboard() {
  const { user } = usePlatformAuth();
  const { startLoading, stopLoading, isLoading } = useLoading();
  const { showError } = useToast();

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activities, setActivities] = useState<PlatformActivity[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = async () => {
    try {
      startLoading();
      const [statsData, activitiesData] = await Promise.all([
        platformDashboardService.getStats(),
        platformDashboardService.getActivities(),
      ]);

      console.log('statsData=====', statsData);
      setStats(statsData);
      setActivities(activitiesData.data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      showError('Erro', 'Não foi possível carregar os dados do dashboard');
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 
      <CheckCircle size={14} className={styles.statusSuccess} /> : 
      <XCircle size={14} className={styles.statusError} />;
  };

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Super Admin</h1>
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
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Crown size={24} />
          </div>
          <div>
            <h1 className={styles.title}>
              Bem-vindo, {user?.firstName || 'Admin'}! 👋
            </h1>
            <p className={styles.subtitle}>
              Painel de controle da plataforma Orbita
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.headerStats}>
            <span className={styles.headerStat}>
              <Clock size={14} />
              Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
            </span>
          </div>
          <button className={styles.refreshButton} onClick={loadData}>
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#2563EB20', color: '#2563EB' }}>
            <Building2 size={24} />
          </div>
          <div>
            <span className={styles.statValue}>{formatNumber(stats?.totalCompanies || 0)}</span>
            <span className={styles.statLabel}>Total de Empresas</span>
          </div>
          <div className={styles.statTrend}>
            <TrendingUp size={12} className={styles.trendUp} />
            <span className={styles.trendText}>+12% este mês</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#10B98120', color: '#10B981' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span className={styles.statValue}>{formatNumber(stats?.activeCompanies || 0)}</span>
            <span className={styles.statLabel}>Empresas Ativas</span>
          </div>
          <div className={styles.statTrend}>
            <TrendingUp size={12} className={styles.trendUp} />
            <span className={styles.trendText}>{stats?.activeCompanies ? Math.round((stats.activeCompanies / stats.totalCompanies) * 100) : 0}% do total</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#8B5CF620', color: '#8B5CF6' }}>
            <Users size={24} />
          </div>
          <div>
            <span className={styles.statValue}>{formatNumber(stats?.totalUsers || 0)}</span>
            <span className={styles.statLabel}>Usuários Totais</span>
          </div>
          <div className={styles.statTrend}>
            <TrendingUp size={12} className={styles.trendUp} />
            <span className={styles.trendText}>+8% este mês</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#F59E0B20', color: '#F59E0B' }}>
            <UserPlus size={24} />
          </div>
          <div>
            <span className={styles.statValue}>{formatNumber(stats?.totalSystemUsers || 0)}</span>
            <span className={styles.statLabel}>Admin da Plataforma</span>
          </div>
          <div className={styles.statTrend}>
            <TrendingUp size={12} className={styles.trendUp} />
            <span className={styles.trendText}>+2 este mês</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Recent Companies */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <Building2 size={16} />
              <h2 className={styles.cardTitle}>Empresas Recentes</h2>
            </div>
            <button className={styles.cardAction}>
              Ver todas <ArrowUpRight size={14} />
            </button>
          </div>
          <div className={styles.cardContent}>
            {stats?.recentCompanies?.map((company) => (
              <div key={company.id} className={styles.listItem}>
                <div className={styles.listItemLeft}>
                  <div className={styles.companyAvatar}>
                    {company.name.charAt(0)}
                  </div>
                  <div>
                    <div className={styles.listItemTitle}>{company.name}</div>
                    <div className={styles.listItemSub}>
                      <Mail size={12} />
                      {company.email || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className={styles.listItemRight}>
                  <div className={styles.listItemBadge}>
                    {getStatusIcon(company.isActive)}
                    <span className={company.isActive ? styles.statusActive : styles.statusInactive}>
                      {company.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <span className={styles.listItemDate}>
                    {formatDate(company.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            {(!stats?.recentCompanies || stats.recentCompanies.length === 0) && (
              <div className={styles.emptyState}>
                <span>Nenhuma empresa recente</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <Activity size={16} />
              <h2 className={styles.cardTitle}>Atividades Recentes</h2>
            </div>
            <button className={styles.cardAction}>
              Ver todas <ArrowUpRight size={14} />
            </button>
          </div>
          <div className={styles.cardContent}>
            {activities.map((activity) => (
              <div key={activity.id} className={styles.listItem}>
                <div className={styles.listItemLeft}>
                  <div className={styles.activityDot}>
                    <div className={`${styles.activityDotInner} ${styles[activity.status]}`} />
                  </div>
                  <div>
                    <div className={styles.listItemTitle}>{activity.description}</div>
                    <div className={styles.listItemSub}>
                      <Users size={12} />
                      {activity.user}
                    </div>
                  </div>
                </div>
                <div className={styles.listItemRight}>
                  <span className={styles.listItemDate}>
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className={styles.emptyState}>
                <span>Nenhuma atividade recente</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <div className={styles.quickActionsHeader}>
          <Zap size={16} />
          <h2 className={styles.quickActionsTitle}>Ações Rápidas</h2>
        </div>
        <div className={styles.quickActionsGrid}>
          <button className={styles.quickAction}>
            <Building2 size={20} />
            <span>Nova Empresa</span>
          </button>
          <button className={styles.quickAction}>
            <UserPlus size={20} />
            <span>Novo Admin</span>
          </button>
          <button className={styles.quickAction}>
            <BarChart3 size={20} />
            <span>Relatórios</span>
          </button>
          <button className={styles.quickAction}>
            <Download size={20} />
            <span>Exportar Dados</span>
          </button>
        </div>
      </div>
    </div>
  );
}