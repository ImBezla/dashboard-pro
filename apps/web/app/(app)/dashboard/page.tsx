'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getSocket } from '@/lib/realtime';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { TeamCard } from '@/components/dashboard/TeamCard';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { TaskItem } from '@/components/dashboard/TaskItem';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { DashboardMiniCalendar } from '@/components/dashboard/DashboardMiniCalendar';
import { DashboardRecentFiles } from '@/components/dashboard/DashboardRecentFiles';
import {
  IconUsers,
  IconFolder,
  IconCurrency,
  IconCheckCircle,
  IconChart,
  IconFolderPlus,
  IconCalendar,
  IconUserPlus,
  IconCheck,
} from '@/components/ui/DashboardIcons';

const WIDGET_CONFIG_KEY = 'dashboard-widget-config';

interface WidgetConfig {
  // Preset
  preset: 'default' | 'minimal' | 'detailed' | 'manager' | 'developer' | 'custom';
  // Main sections
  metrics: boolean;
  team: boolean;
  projects: boolean;
  tasks: boolean;
  activities: boolean;
  quickActions: boolean;
  calendar: boolean;
  recentFiles: boolean;
  // Individual metrics
  showPerformance: boolean;
  showProjects: boolean;
  showRevenue: boolean;
  showTaskCount: boolean;
  // Display options
  compactMode: boolean;
  darkCards: boolean;
  animationsEnabled: boolean;
  showTrends: boolean;
  gridColumns: 2 | 3 | 4;
  // Limits
  maxTeamMembers: number;
  maxProjects: number;
  maxTasks: number;
  maxActivities: number;
}

const defaultWidgetConfig: WidgetConfig = {
  preset: 'default',
  metrics: true,
  team: true,
  projects: true,
  tasks: true,
  activities: true,
  quickActions: true,
  calendar: false,
  recentFiles: false,
  showPerformance: true,
  showProjects: true,
  showRevenue: true,
  showTaskCount: true,
  compactMode: false,
  darkCards: false,
  animationsEnabled: true,
  showTrends: true,
  gridColumns: 4,
  maxTeamMembers: 3,
  maxProjects: 3,
  maxTasks: 4,
  maxActivities: 5,
};

// Presets
const PRESETS: Record<string, Partial<WidgetConfig>> = {
  default: defaultWidgetConfig,
  minimal: {
    preset: 'minimal',
    metrics: true,
    team: false,
    projects: true,
    tasks: true,
    activities: false,
    quickActions: false,
    calendar: false,
    recentFiles: false,
    showPerformance: true,
    showProjects: true,
    showRevenue: false,
    showTaskCount: true,
    compactMode: true,
    gridColumns: 3,
    maxTeamMembers: 2,
    maxProjects: 2,
    maxTasks: 3,
  },
  detailed: {
    preset: 'detailed',
    metrics: true,
    team: true,
    projects: true,
    tasks: true,
    activities: true,
    quickActions: true,
    calendar: true,
    recentFiles: true,
    showPerformance: true,
    showProjects: true,
    showRevenue: true,
    showTaskCount: true,
    compactMode: false,
    showTrends: true,
    gridColumns: 4,
    maxTeamMembers: 6,
    maxProjects: 5,
    maxTasks: 8,
    maxActivities: 10,
  },
  manager: {
    preset: 'manager',
    metrics: true,
    team: true,
    projects: true,
    tasks: false,
    activities: true,
    quickActions: true,
    calendar: true,
    recentFiles: false,
    showPerformance: true,
    showProjects: true,
    showRevenue: true,
    showTaskCount: false,
    gridColumns: 4,
    maxTeamMembers: 6,
    maxProjects: 4,
  },
  developer: {
    preset: 'developer',
    metrics: true,
    team: false,
    projects: true,
    tasks: true,
    activities: false,
    quickActions: true,
    calendar: false,
    recentFiles: true,
    showPerformance: false,
    showProjects: true,
    showRevenue: false,
    showTaskCount: true,
    compactMode: true,
    gridColumns: 3,
    maxTasks: 10,
    maxProjects: 3,
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(defaultWidgetConfig);

  // Load widget config from localStorage
  useEffect(() => {
    setIsClient(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setHasToken(!!token);
    
    // Load saved widget config
    const savedConfig = localStorage.getItem(WIDGET_CONFIG_KEY);
    if (savedConfig) {
      try {
        setWidgetConfig({ ...defaultWidgetConfig, ...JSON.parse(savedConfig) });
      } catch (e) {
        console.error('Failed to load widget config');
      }
    }
  }, []);

  const updateWidgetConfig = <K extends keyof WidgetConfig>(
    key: K,
    value: WidgetConfig[K],
  ) => {
    const newConfig = { ...widgetConfig, [key]: value };
    setWidgetConfig(newConfig);
    localStorage.setItem(WIDGET_CONFIG_KEY, JSON.stringify(newConfig));
  };

  const { data, refetch, error, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const response = await api.get('/dashboard/overview');
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          throw err;
        }
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
    enabled: isClient && hasToken,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleTaskUpdate = () => {
      refetch();
    };

    const handleProjectUpdate = () => {
      refetch();
    };

    socket.on('task.created', handleTaskUpdate);
    socket.on('task.updated', handleTaskUpdate);
    socket.on('task.deleted', handleTaskUpdate);
    socket.on('project.created', handleProjectUpdate);
    socket.on('project.updated', handleProjectUpdate);
    socket.on('project.deleted', handleProjectUpdate);

    return () => {
      socket.off('task.created', handleTaskUpdate);
      socket.off('task.updated', handleTaskUpdate);
      socket.off('task.deleted', handleTaskUpdate);
      socket.off('project.created', handleProjectUpdate);
      socket.off('project.updated', handleProjectUpdate);
      socket.off('project.deleted', handleProjectUpdate);
    };
  }, [refetch]);

  // Show loading state during initial client-side check
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[200px] p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-light animate-pulse text-sm sm:text-base">Lädt…</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-light animate-pulse text-sm sm:text-base">Lädt…</div>
        </div>
      </div>
    );
  }

  if (isError || (error && !data)) {
    const ax = error as {
      message?: string;
      response?: { data?: { message?: string | string[] } };
    };
    const raw = ax?.response?.data?.message;
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : raw || ax?.message || 'Laden fehlgeschlagen.';
    return (
      <div className="flex items-center justify-center min-h-[200px] p-4">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-2 text-sm sm:text-base font-medium">
            Dashboard konnte nicht geladen werden
          </div>
          <p className="text-text-light text-sm mb-4">{message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="bg-primary text-white px-5 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors min-h-[44px] touch-manipulation"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  // Use default empty data if data is null
  const dashboardData = data || {
    teamPerformance: 0,
    activeProjectsCount: 0,
    revenue: 0,
    aiInsightsCount: 0,
    teamMembers: [],
    projectSummaries: [],
    tasksSummary: { recent: [] },
    trends: {},
  };

  const activeProjectList = (dashboardData.projectSummaries || []).filter(
    (p: { status: string }) =>
      p.status === 'ACTIVE' ||
      p.status === 'IN_PROGRESS' ||
      p.status === 'PENDING',
  );
  const visibleProjects = activeProjectList.slice(0, widgetConfig.maxProjects);
  const moreProjectsCount = Math.max(0, activeProjectList.length - visibleProjects.length);

  const teamMembersList = dashboardData.teamMembers || [];
  const visibleTeamMembers = teamMembersList.slice(0, widgetConfig.maxTeamMembers);
  const moreTeamMembersCount = Math.max(0, teamMembersList.length - visibleTeamMembers.length);

  const recentTasks = dashboardData.tasksSummary?.recent || [];
  const visibleTasks = recentTasks.slice(0, widgetConfig.maxTasks);
  const moreTasksCount = Math.max(0, recentTasks.length - visibleTasks.length);

  const teamGridClass = widgetConfig.team
    ? widgetConfig.projects
      ? 'lg:col-span-8'
      : 'lg:col-span-12'
    : '';

  const projectsGridClass = widgetConfig.projects
    ? widgetConfig.team
      ? 'lg:col-span-4'
      : 'lg:col-span-12'
    : '';

  const metricLgSpan =
    widgetConfig.gridColumns === 2
      ? 'lg:col-span-6'
      : widgetConfig.gridColumns === 3
        ? 'lg:col-span-4'
        : 'lg:col-span-3';

  return (
    <div className="min-w-0">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-dark mb-1 truncate">
            Dashboard
          </h1>
        </div>
        <button
          onClick={() => setShowWidgetConfig(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-sm font-medium text-text-light hover:text-dark bg-white border border-border rounded-xl hover:bg-light transition-colors touch-manipulation min-h-[44px] shrink-0"
        >
          ⚙️ Layout
        </button>
      </div>

      {/* Widget Configuration Panel - Slide in from right */}
      {showWidgetConfig && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowWidgetConfig(false)}
          />
          <div className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:h-full w-full sm:w-96 max-h-[100dvh] sm:max-h-none bg-white shadow-2xl z-50 overflow-y-auto animate-slideIn rounded-none sm:rounded-l-xl">
            <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between z-10 gap-2">
              <h3 className="font-bold text-dark truncate">⚙️ Layout</h3>
              <button
                onClick={() => setShowWidgetConfig(false)}
                className="p-2.5 -mr-1 hover:bg-light rounded-xl transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 pb-8 sm:pb-4 space-y-6">
              {/* Presets */}
              <div>
                <h4 className="text-sm font-semibold text-text-light uppercase tracking-wide mb-3">🎨 Vorlagen</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'default', label: 'Standard', icon: '🏠' },
                    { key: 'minimal', label: 'Minimal', icon: '✨' },
                    { key: 'detailed', label: 'Detailliert', icon: '📋' },
                    { key: 'manager', label: 'Manager', icon: '👔' },
                    { key: 'developer', label: 'Entwickler', icon: '💻' },
                    { key: 'custom', label: 'Eigenes', icon: '🛠️' },
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => {
                        if (preset.key !== 'custom') {
                          const newConfig = { ...defaultWidgetConfig, ...PRESETS[preset.key], preset: preset.key as any };
                          setWidgetConfig(newConfig);
                          localStorage.setItem(WIDGET_CONFIG_KEY, JSON.stringify(newConfig));
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all min-h-[52px] touch-manipulation ${
                        widgetConfig.preset === preset.key
                          ? 'border-primary bg-primary/5 ring-2 ring-primary'
                          : 'border-border hover:border-primary/50 hover:bg-light'
                      }`}
                    >
                      <div className="text-lg">{preset.icon}</div>
                      <div className="font-medium text-sm text-dark">{preset.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections */}
              <div>
                <h4 className="text-sm font-semibold text-text-light uppercase tracking-wide mb-3">📦 Bereiche</h4>
                <div className="space-y-2">
                  {[
                    { key: 'metrics' as const, label: 'Metriken', icon: '📊' },
                    { key: 'team' as const, label: 'Team', icon: '👥' },
                    { key: 'projects' as const, label: 'Projekte', icon: '📁' },
                    { key: 'tasks' as const, label: 'Aufgaben', icon: '✅' },
                    { key: 'activities' as const, label: 'Aktivitäten', icon: '🔔' },
                    { key: 'quickActions' as const, label: 'Schnellzugriff', icon: '⚡' },
                    { key: 'calendar' as const, label: 'Kalender', icon: '📅' },
                    { key: 'recentFiles' as const, label: 'Dateien', icon: '📄' },
                  ].map((widget) => (
                    <label
                      key={widget.key}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-light transition-colors cursor-pointer min-h-[48px] touch-manipulation"
                    >
                      <input
                        type="checkbox"
                        checked={widgetConfig[widget.key]}
                        onChange={(e) => {
                          updateWidgetConfig(widget.key, e.target.checked);
                          updateWidgetConfig('preset', 'custom');
                        }}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                      />
                      <span className="text-lg">{widget.icon}</span>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-dark">{widget.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Metric Cards */}
              {widgetConfig.metrics && (
                <div>
                  <h4 className="text-sm font-semibold text-text-light uppercase tracking-wide mb-3">📈 Metrikkarten</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'showPerformance' as const, label: 'Performance', icon: '📊' },
                      { key: 'showProjects' as const, label: 'Projekte', icon: '📁' },
                      { key: 'showRevenue' as const, label: 'Umsatz', icon: '💰' },
                      { key: 'showTaskCount' as const, label: 'Aufgaben', icon: '✅' },
                    ].map((metric) => (
                      <label
                        key={metric.key}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                          widgetConfig[metric.key]
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={widgetConfig[metric.key]}
                          onChange={(e) => {
                            updateWidgetConfig(metric.key, e.target.checked);
                            updateWidgetConfig('preset', 'custom');
                          }}
                          className="sr-only"
                        />
                        <span>{metric.icon}</span>
                        <span className="text-sm text-dark">{metric.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Display Options */}
              <div>
                <h4 className="text-sm font-semibold text-text-light uppercase tracking-wide mb-3">🎛️ Darstellung</h4>
                <div className="space-y-3">
                  {[
                    { key: 'compactMode' as const, label: 'Kompakt' },
                    { key: 'darkCards' as const, label: 'Dunkle Karten' },
                    { key: 'animationsEnabled' as const, label: 'Animationen' },
                    { key: 'showTrends' as const, label: 'Trends' },
                  ].map((option) => (
                    <label
                      key={option.key}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-light transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="text-sm font-medium text-dark">{option.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={widgetConfig[option.key]}
                        onChange={(e) => {
                          updateWidgetConfig(option.key, e.target.checked);
                          updateWidgetConfig('preset', 'custom');
                        }}
                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                      />
                    </label>
                  ))}
                  
                  {/* Grid Columns */}
                  <div className="pt-2">
                    <label className="text-sm font-medium text-dark block mb-2">Metriken-Spalten</label>
                    <div className="flex gap-2">
                      {[2, 3, 4].map((cols) => (
                        <button
                          key={cols}
                          onClick={() => {
                            updateWidgetConfig('gridColumns', cols as any);
                            updateWidgetConfig('preset', 'custom');
                          }}
                          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                            widgetConfig.gridColumns === cols
                              ? 'border-primary bg-primary text-white'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {cols}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div>
                <h4 className="text-sm font-semibold text-text-light uppercase tracking-wide mb-3">🔢 Anzahl</h4>
                <div className="space-y-4">
                  {[
                    { key: 'maxTeamMembers' as const, label: 'Team-Mitglieder', min: 1, max: 10 },
                    { key: 'maxProjects' as const, label: 'Projekte', min: 1, max: 10 },
                    { key: 'maxTasks' as const, label: 'Aufgaben', min: 1, max: 15 },
                    { key: 'maxActivities' as const, label: 'Aktivitäten', min: 1, max: 15 },
                  ].map((limit) => (
                    <div key={limit.key}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-sm text-dark">{limit.label}</label>
                        <span className="text-sm font-mono bg-slate-100 px-2 py-0.5 rounded">
                          {widgetConfig[limit.key]}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={limit.min}
                        max={limit.max}
                        value={widgetConfig[limit.key]}
                        onChange={(e) => {
                          updateWidgetConfig(limit.key, parseInt(e.target.value) as any);
                          updateWidgetConfig('preset', 'custom');
                        }}
                        className="w-full accent-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-border p-4 space-y-2">
              <button
                onClick={() => {
                  setWidgetConfig(defaultWidgetConfig);
                  localStorage.setItem(WIDGET_CONFIG_KEY, JSON.stringify(defaultWidgetConfig));
                }}
                className="w-full px-4 py-2 text-sm font-medium text-text border border-border rounded-lg hover:bg-light transition-colors"
              >
                ↺ Standard
              </button>
            </div>
          </div>
        </>
      )}

      {widgetConfig.metrics && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6 mb-6 sm:mb-8 min-w-0">
        <div className={`${metricLgSpan} animate-fadeIn min-w-0`} style={{ animationDelay: '0.1s' }}>
          <MetricCard
            title="Team Performance"
            value={`${dashboardData.teamPerformance || 0}%`}
            subtitle={dashboardData.teamMembers?.length ? `${dashboardData.teamMembers.length} Mitglieder` : undefined}
            trend={{ 
              value: dashboardData.trends?.teamPerformance 
                ? `${dashboardData.trends.teamPerformance > 0 ? '+' : ''}${dashboardData.trends.teamPerformance}%` 
                : `${dashboardData.teamPerformance || 0}%`, 
              positive: (dashboardData.trends?.teamPerformance || 0) >= 0 && (dashboardData.teamPerformance || 0) >= 70
            }}
            icon={<IconUsers />}
          />
        </div>
        <div className={`${metricLgSpan} animate-fadeIn min-w-0`} style={{ animationDelay: '0.2s' }}>
            <MetricCard
              title="Aktive Projekte"
              value={dashboardData.activeProjectsCount || dashboardData.projectSummaries?.filter((p: any) => 
                p.status === 'ACTIVE' || p.status === 'IN_PROGRESS' || p.status === 'PENDING'
              ).length || 0}
              subtitle={dashboardData.projectSummaries?.length ? `${dashboardData.projectSummaries.length} gesamt` : undefined}
              trend={{ 
                value: dashboardData.trends?.projects
                  ? `${dashboardData.trends.projects > 0 ? '+' : ''}${dashboardData.trends.projects}`
                  : '—',
                positive: (dashboardData.trends?.projects || 0) >= 0 
              }}
              icon={<IconFolder />}
              gradient="bg-gradient-to-br from-green-600 to-green-700"
            />
        </div>
        <div className={`${metricLgSpan} animate-fadeIn min-w-0`} style={{ animationDelay: '0.3s' }}>
          <MetricCard
            title="Umsatz"
            value={dashboardData.revenue ? (dashboardData.revenue >= 1000000 
              ? `€${(dashboardData.revenue / 1000000).toFixed(1)}M` 
              : dashboardData.revenue >= 1000 
              ? `€${(dashboardData.revenue / 1000).toFixed(0)}k` 
              : `€${dashboardData.revenue.toFixed(0)}`) : '€0'}
            trend={{ 
              value: dashboardData.trends?.revenue !== undefined 
                ? `${dashboardData.trends.revenue > 0 ? '+' : ''}${dashboardData.trends.revenue}%` 
                : '0%', 
              positive: (dashboardData.trends?.revenue || 0) >= 0 
            }}
            icon={<IconCurrency />}
            gradient="bg-gradient-to-br from-amber-600 to-amber-700"
          />
        </div>
        <div className={`${metricLgSpan} animate-fadeIn min-w-0`} style={{ animationDelay: '0.4s' }}>
          <MetricCard
            title="Aufgaben"
            value={`${dashboardData.tasksSummary?.done || 0}/${dashboardData.tasksSummary?.total || 0}`}
            trend={{ 
              value: dashboardData.tasksSummary?.total
                ? `${Math.round(((dashboardData.tasksSummary.done || 0) / dashboardData.tasksSummary.total) * 100)}%`
                : '—',
              positive: dashboardData.tasksSummary?.total 
                ? ((dashboardData.tasksSummary.done || 0) / dashboardData.tasksSummary.total) >= 0.5
                : false
            }}
            icon={<IconCheckCircle />}
            gradient="bg-gradient-to-br from-slate-600 to-slate-700"
          />
        </div>
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-6 sm:mb-8 min-w-0">
        {widgetConfig.team && (
        <div className={[teamGridClass, 'min-w-0'].filter(Boolean).join(' ')}>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-border overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-6 min-w-0">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-dark truncate">Team</div>
              </div>
              <div
                className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shrink-0"
                title="Live"
                aria-label="Live"
              />
            </div>
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 ${
                widgetConfig.projects ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-3 xl:grid-cols-4'
              }`}
            >
              {dashboardData.teamMembers && dashboardData.teamMembers.length > 0 ? (
                visibleTeamMembers.map((member: any) => (
                  <TeamCard 
                    key={member.id} 
                    member={member}
                    onClick={() => router.push(`/team/${member.id}`)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center text-text-light py-8 min-w-0">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <IconUsers />
                  </div>
                  <p className="mb-3 text-sm text-text-light">Kein Team</p>
                  <button
                    onClick={() => router.push('/team')}
                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm"
                  >
                    <IconUserPlus />
                    Zum Team
                  </button>
                </div>
              )}
            </div>
            {moreTeamMembersCount > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push('/team')}
                  className="text-primary hover:text-primary-dark text-sm font-semibold"
                >
                  +{moreTeamMembersCount} →
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {widgetConfig.projects && (
        <div className={[projectsGridClass, 'min-w-0'].filter(Boolean).join(' ')}>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-border overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-6 min-w-0">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-dark truncate">Projekte</div>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                <IconChart />
              </div>
            </div>
            <div className="space-y-4 min-w-0 overflow-hidden">
              {activeProjectList.length > 0 ? (
                <>
                  {visibleProjects.map((project: any) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                  {moreProjectsCount > 0 && (
                    <button
                      onClick={() => router.push('/projects')}
                      className="w-full text-center text-primary hover:text-primary-dark text-sm font-medium py-2"
                    >
                      +{moreProjectsCount}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center text-text-light py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <IconFolder />
                  </div>
                  <p className="mb-3 text-sm text-text-light">Keine Projekte</p>
                  <button
                    onClick={() => router.push('/projects/new')}
                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm"
                  >
                    <IconFolderPlus />
                    Projekt erstellen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>

      {widgetConfig.tasks && (
      <div className="bg-white rounded-xl shadow-sm border border-border mb-4 sm:mb-6 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
            <div className="min-w-0">
              <div className="text-lg font-semibold text-dark truncate">Aufgaben</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div
                className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shrink-0"
                title="Live"
                aria-label="Live"
              />
              <button
                onClick={() => router.push('/tasks')}
                className="text-primary hover:text-primary-dark text-sm font-medium"
              >
                Alle →
              </button>
            </div>
          </div>
        </div>
        <div>
          {recentTasks.length > 0 ? (
            <>
              {visibleTasks.map((task: any, index: number) => (
                <div key={task.id} className="animate-slideIn" style={{ animationDelay: `${index * 0.1}s` }}>
                  <TaskItem task={task} onUpdate={refetch} />
                </div>
              ))}
              {moreTasksCount > 0 && (
                <div className="p-4 text-center border-t border-border">
                  <button
                    onClick={() => router.push('/tasks')}
                    className="text-primary hover:text-primary-dark text-sm font-medium"
                  >
                    +{moreTasksCount} →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-text-light">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <IconCheckCircle />
              </div>
              <p className="mb-3 text-sm text-text-light">Keine Aufgaben</p>
              <button
                onClick={() => router.push('/tasks/new')}
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors text-sm"
              >
                Aufgabe erstellen
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {(widgetConfig.calendar || widgetConfig.recentFiles) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {widgetConfig.calendar && <DashboardMiniCalendar />}
          {widgetConfig.recentFiles && <DashboardRecentFiles />}
        </div>
      )}

      <div
        className={`grid grid-cols-1 gap-4 sm:gap-6 ${
          widgetConfig.quickActions && widgetConfig.activities ? 'lg:grid-cols-2' : ''
        }`}
      >
        {widgetConfig.quickActions && (
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-border overflow-hidden min-w-0 lg:min-w-0">
          <div className="flex items-center justify-between mb-4 min-w-0">
            <div className="text-base sm:text-lg font-semibold text-dark truncate">Schnellzugriff</div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => router.push('/projects/new')}
              className="p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors text-left flex items-start gap-2 sm:gap-3 min-h-[56px] touch-manipulation min-w-0 overflow-hidden"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                <IconFolderPlus />
              </div>
              <div className="min-w-0 overflow-hidden self-center">
                <div className="font-medium text-dark text-sm truncate">Neues Projekt</div>
              </div>
            </button>
            <button
              onClick={() => router.push('/tasks/new')}
              className="p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors text-left flex items-start gap-2 sm:gap-3 min-h-[56px] touch-manipulation min-w-0 overflow-hidden"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                <IconCheckCircle />
              </div>
              <div className="min-w-0 overflow-hidden self-center">
                <div className="font-medium text-dark text-sm truncate">Neue Aufgabe</div>
              </div>
            </button>
            <button
              onClick={() => router.push('/calendar')}
              className="p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors text-left flex items-start gap-2 sm:gap-3 min-h-[56px] touch-manipulation min-w-0 overflow-hidden"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                <IconCalendar />
              </div>
              <div className="min-w-0 overflow-hidden self-center">
                <div className="font-medium text-dark text-sm truncate">Kalender</div>
              </div>
            </button>
            <button
              onClick={() => router.push('/customers')}
              className="p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors text-left flex items-start gap-2 sm:gap-3 min-h-[56px] touch-manipulation min-w-0 overflow-hidden"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                <IconUserPlus />
              </div>
              <div className="min-w-0 overflow-hidden self-center">
                <div className="font-medium text-dark text-sm truncate">Kunde</div>
              </div>
            </button>
          </div>
        </div>
        )}

        {widgetConfig.activities && <ActivityFeed />}
      </div>
    </div>
  );
}

