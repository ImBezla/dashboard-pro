'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

function sumSeriesValues(data: { value?: number }[]) {
  return data.reduce((s, d) => s + (d.value ?? 0), 0);
}

function AnalyticsEmptyChart({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[220px] px-4 py-8 rounded-xl border border-dashed border-border bg-slate-50/60 text-center"
      role="status"
    >
      <span className="text-2xl mb-2 opacity-40 select-none" aria-hidden>
        —
      </span>
      <p className="text-sm text-text-light">{message}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        const response = await api.get('/dashboard/overview');
        return response.data;
      } catch (err: any) {
        console.error('Analytics dashboard error:', err);
        return null;
      }
    },
    retry: 1,
  });

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const response = await api.get('/projects');
        return response.data;
      } catch (err: any) {
        console.error('Analytics projects error:', err);
        return [];
      }
    },
    retry: 1,
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const response = await api.get('/tasks');
        return response.data;
      } catch (err: any) {
        console.error('Analytics tasks error:', err);
        return [];
      }
    },
    retry: 1,
  });

  const isLoading = isLoadingDashboard || isLoadingProjects || isLoadingTasks;

  // Echte Daten aus Projekten berechnen
  const projectStatusData = projects?.reduce((acc: any, project: any) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {}) || {};

  // Echte Daten aus Tasks berechnen
  const taskStatusData = tasks?.reduce((acc: any, task: any) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const taskPriorityData = tasks?.reduce((acc: any, task: any) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {}) || {};

  const projectProgressData = projects?.map((project: any) => {
    const projectTasks = project.tasks || [];
    const completed = projectTasks.filter((t: any) => t.status === 'DONE').length;
    const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
    return {
      name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
      progress,
      tasks: projectTasks.length,
    };
  }) || [];

  // Berechne Start- und Enddatum basierend auf timeRange
  const getDateRange = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    switch (timeRange) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  // Filtere Tasks nach Zeitraum
  const filteredTasks = tasks?.filter((task: any) => {
    const taskDate = new Date(task.createdAt);
    return taskDate >= rangeStart && taskDate <= rangeEnd;
  }) || [];

  // Filtere Projekte nach Zeitraum (nach createdAt oder updatedAt)
  const filteredProjects = projects?.filter((project: any) => {
    const projectDate = new Date(project.updatedAt || project.createdAt);
    return projectDate >= rangeStart && projectDate <= rangeEnd;
  }) || [];

  // Zeitreihen-Daten basierend auf timeRange
  const calculateTimeSeriesData = () => {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    const now = new Date();
    let intervals: { start: Date; end: Date; label: string }[] = [];

    if (timeRange === 'week') {
      // Letzte 7 Tage
      const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        intervals.push({ start, end, label: days[date.getDay()] });
      }
    } else if (timeRange === 'month') {
      // Letzte 4 Wochen
      for (let i = 3; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(end.getDate() - i * 7);
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        intervals.push({ start, end, label: `KW ${Math.ceil((end.getDate()) / 7)}` });
      }
    } else if (timeRange === 'quarter') {
      // Letzte 3 Monate
      const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
      for (let i = 2; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        intervals.push({ start, end, label: months[date.getMonth()] });
      }
    } else {
      // Jahr: Letzte 12 Monate
      const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        intervals.push({ start, end, label: months[date.getMonth()] });
      }
    }

    return intervals.map(({ start, end, label }) => {
      const intervalTasks = tasks.filter((task: any) => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= start && taskDate <= end;
      });

      const completedTasks = tasks.filter((task: any) => {
        if (task.status !== 'DONE') return false;
        const taskDate = new Date(task.updatedAt || task.createdAt);
        return taskDate >= start && taskDate <= end;
      });

      return {
        name: label,
        tasks: intervalTasks.length,
        completed: completedTasks.length,
      };
    });
  };

  const timeSeriesData = calculateTimeSeriesData();

  const projectCount = projects?.length ?? 0;
  const taskCount = tasks?.length ?? 0;
  const hasProjects = projectCount > 0;
  const hasTasks = taskCount > 0;
  const priorityTotal =
    (taskPriorityData.HIGH || 0) + (taskPriorityData.MEDIUM || 0) + (taskPriorityData.LOW || 0);

  const pieData = [
    { name: 'Aktiv', value: projectStatusData.ACTIVE || 0 },
    { name: 'Wartend', value: projectStatusData.PENDING || 0 },
    { name: 'Abgeschlossen', value: projectStatusData.COMPLETED || 0 },
    { name: 'Archiviert', value: projectStatusData.ARCHIVED || 0 },
  ];
  const projectPieTotal = sumSeriesValues(pieData);

  const taskPieData = [
    { name: 'Offen', value: taskStatusData.OPEN || 0 },
    { name: 'In Bearbeitung', value: taskStatusData.IN_PROGRESS || 0 },
    { name: 'Erledigt', value: taskStatusData.DONE || 0 },
  ];
  const taskPieTotal = sumSeriesValues(taskPieData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-tour="page-analytics">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-light animate-pulse">Lädt…</div>
        </div>
      </div>
    );
  }

  return (
    <div data-tour="page-analytics">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark">Analytics</h1>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-white text-text hover:bg-light'
              }`}
            >
              {range === 'week' && 'Woche'}
              {range === 'month' && 'Monat'}
              {range === 'quarter' && 'Quartal'}
              {range === 'year' && 'Jahr'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Projekte im Zeitraum"
          value={hasProjects ? filteredProjects.length : '—'}
          subtitle={hasProjects ? `${projectCount} gesamt` : undefined}
          icon="📁"
        />
        <MetricCard
          title="Aufgaben im Zeitraum"
          value={hasTasks ? filteredTasks.filter((t: any) => t.status !== 'DONE').length : '—'}
          subtitle={hasTasks ? 'Offen / aktiv' : undefined}
          icon="✅"
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <MetricCard
          title="Erledigt im Zeitraum"
          value={hasTasks ? filteredTasks.filter((t: any) => t.status === 'DONE').length : '—'}
          subtitle={hasTasks ? `${filteredTasks.length} im Zeitraum` : undefined}
          icon="✓"
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Team Performance"
          value={`${dashboardData?.teamPerformance || 0}%`}
          subtitle="Ø"
          icon="👥"
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow border border-border">
          <h2 className="text-xl font-bold text-dark mb-4">Aufgaben-Trend</h2>
          {hasTasks && timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tasks" stroke="#6366f1" name="Aufgaben" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Erledigt" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <AnalyticsEmptyChart message="Keine Aufgaben" />
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow border border-border">
          <h2 className="text-xl font-bold text-dark mb-4">Projekt-Status</h2>
          {hasProjects && projectPieTotal > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <AnalyticsEmptyChart message={hasProjects ? 'Keine Status-Daten' : 'Keine Projekte'} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow border border-border">
          <h2 className="text-xl font-bold text-dark mb-4">Projekt-Fortschritt</h2>
          {hasProjects ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="progress" fill="#6366f1" name="Fortschritt %" />
                <Bar dataKey="tasks" fill="#8b5cf6" name="Aufgaben" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <AnalyticsEmptyChart message="Keine Projekte" />
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow border border-border">
          <h2 className="text-xl font-bold text-dark mb-4">Aufgaben-Status</h2>
          {hasTasks && taskPieTotal > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <AnalyticsEmptyChart message={hasTasks ? 'Keine Status-Werte' : 'Keine Aufgaben'} />
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow border border-border">
        <h2 className="text-xl font-bold text-dark mb-4">Aufgaben-Priorität</h2>
        {hasTasks && priorityTotal > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { name: 'Hoch', value: taskPriorityData.HIGH || 0 },
                { name: 'Mittel', value: taskPriorityData.MEDIUM || 0 },
                { name: 'Niedrig', value: taskPriorityData.LOW || 0 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <AnalyticsEmptyChart message={hasTasks ? 'Keine Prioritäten' : 'Keine Aufgaben'} />
        )}
      </div>
    </div>
  );
}
