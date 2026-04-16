'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
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

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'projects' | 'tasks' | 'team' | 'financial'>('projects');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const response = await api.get('/projects');
        return response.data;
      } catch (err: any) {
        console.error('Reports projects error:', err);
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
        console.error('Reports tasks error:', err);
        return [];
      }
    },
    retry: 1,
  });

  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      try {
        const response = await api.get('/team');
        return response.data;
      } catch (err: any) {
        console.error('Reports teams error:', err);
        return [];
      }
    },
    retry: 1,
  });

  const { data: financeData, isLoading: isLoadingFinance } = useQuery({
    queryKey: ['finance'],
    queryFn: async () => {
      try {
        const response = await api.get('/finance/overview');
        return response.data;
      } catch (err: any) {
        console.error('Reports finance error:', err);
        return null;
      }
    },
    retry: 1,
  });

  const { data: financialData } = useQuery({
    queryKey: ['financial-report', dateRange],
    queryFn: async () => {
      try {
        const response = await api.get(`/reports/financial?timeRange=${dateRange}`);
        return response.data;
      } catch (err: any) {
        console.error('Reports financial error:', err);
        return [];
      }
    },
    retry: 1,
  });

  const isLoading = isLoadingProjects || isLoadingTasks || isLoadingTeams || isLoadingFinance;

  // Projekt-Report Daten
  const projectReportData = projects?.map((project: any) => {
    const projectTasks = project.tasks || [];
    const completed = projectTasks.filter((t: any) => t.status === 'DONE').length;
    const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
    return {
      name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
      tasks: projectTasks.length,
      completed,
      progress,
      status: project.status,
    };
  }) || [];

  // Task-Report Daten
  const taskReportData = [
    {
      name: 'Offen',
      value: tasks?.filter((t: any) => t.status === 'OPEN').length || 0,
    },
    {
      name: 'In Bearbeitung',
      value: tasks?.filter((t: any) => t.status === 'IN_PROGRESS').length || 0,
    },
    {
      name: 'Erledigt',
      value: tasks?.filter((t: any) => t.status === 'DONE').length || 0,
    },
  ];

  // Team-Report Daten
  const teamPerformanceData = teams?.map((team: any) => {
    const teamTasks = tasks?.filter((task: any) => task.project?.teamId === team.id) || [];
    const completed = teamTasks.filter((t: any) => t.status === 'DONE').length;
    const performance = teamTasks.length > 0 ? Math.round((completed / teamTasks.length) * 100) : 0;
    return {
      name: team.name,
      tasks: teamTasks.length,
      completed,
      performance,
    };
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-light animate-pulse">Lädt Report-Daten...</div>
        </div>
      </div>
    );
  }

  const generateCSV = () => {
    let csvContent = '';
    const now = new Date().toLocaleDateString('de-DE');
    
    if (reportType === 'projects') {
      csvContent = 'Projekt,Aufgaben,Erledigt,Fortschritt %,Status\n';
      projectReportData.forEach((p: any) => {
        csvContent += `"${p.name}",${p.tasks},${p.completed},${p.progress},${p.status}\n`;
      });
    } else if (reportType === 'tasks') {
      csvContent = 'Titel,Status,Priorität,Projekt,Deadline\n';
      tasks?.forEach((t: any) => {
        const deadline = t.deadline ? new Date(t.deadline).toLocaleDateString('de-DE') : '-';
        csvContent += `"${t.title}",${t.status},${t.priority},"${t.project?.name || '-'}",${deadline}\n`;
      });
    } else if (reportType === 'team') {
      csvContent = 'Team,Aufgaben,Erledigt,Performance %\n';
      teamPerformanceData.forEach((t: any) => {
        csvContent += `"${t.name}",${t.tasks},${t.completed},${t.performance}\n`;
      });
    } else if (reportType === 'financial') {
      csvContent = 'Monat,Umsatz,Ausgaben\n';
      financialData?.forEach((f: any) => {
        csvContent += `${f.month},${f.revenue || 0},${f.expenses || 0}\n`;
      });
    }
    
    return csvContent;
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    if (format === 'csv') {
      const csvContent = generateCSV();
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Use browser print functionality for PDF
      window.print();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-dark mb-2">Berichte</h1>
          <p className="text-lg text-text-light">
            Erstellen Sie detaillierte Berichte und Analysen
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={() => handleExport('csv')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            📊 CSV Export
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            🖨️ Drucken / PDF
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['projects', 'tasks', 'team', 'financial'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              reportType === type
                ? 'bg-primary text-white'
                : 'bg-white text-text hover:bg-light'
            }`}
          >
            {type === 'projects' && 'Projekte'}
            {type === 'tasks' && 'Aufgaben'}
            {type === 'team' && 'Team'}
            {type === 'financial' && 'Finanzen'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              dateRange === range
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

      {reportType === 'projects' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow border border-border">
            <h2 className="text-xl font-bold text-dark mb-4">Projekt-Übersicht</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={projectReportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tasks" fill="#6366f1" name="Aufgaben" />
                <Bar dataKey="completed" fill="#10b981" name="Erledigt" />
                <Bar dataKey="progress" fill="#8b5cf6" name="Fortschritt %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow border border-border">
            <h2 className="text-xl font-bold text-dark mb-4">Projekt-Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-light rounded-lg">
                <div className="text-2xl font-black text-primary mb-1">
                  {projects?.filter((p: any) => p.status === 'ACTIVE').length || 0}
                </div>
                <div className="text-sm text-text-light">Aktiv</div>
              </div>
              <div className="text-center p-4 bg-light rounded-lg">
                <div className="text-2xl font-black text-yellow-600 mb-1">
                  {projects?.filter((p: any) => p.status === 'PENDING').length || 0}
                </div>
                <div className="text-sm text-text-light">Wartend</div>
              </div>
              <div className="text-center p-4 bg-light rounded-lg">
                <div className="text-2xl font-black text-green-600 mb-1">
                  {projects?.filter((p: any) => p.status === 'COMPLETED').length || 0}
                </div>
                <div className="text-sm text-text-light">Abgeschlossen</div>
              </div>
              <div className="text-center p-4 bg-light rounded-lg">
                <div className="text-2xl font-black text-gray-600 mb-1">
                  {projects?.filter((p: any) => p.status === 'ARCHIVED').length || 0}
                </div>
                <div className="text-sm text-text-light">Archiviert</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'tasks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow border border-border">
            <h2 className="text-xl font-bold text-dark mb-4">Aufgaben-Status</h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={taskReportData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskReportData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow border border-border">
            <h2 className="text-xl font-bold text-dark mb-4">Aufgaben-Statistiken</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-light rounded-lg">
                <div className="text-2xl font-black text-primary mb-1">
                  {tasks?.length || 0}
                </div>
                <div className="text-sm text-text-light">Gesamt</div>
              </div>
              <div className="text-center p-4 bg-light rounded-lg">
                <div className="text-2xl font-black text-yellow-600 mb-1">
                  {tasks?.filter((t: any) => t.priority === 'HIGH').length || 0}
                </div>
                <div className="text-sm text-text-light">Hohe Priorität</div>
              </div>
              <div className="text-center p-4 bg-light rounded-lg">
                <div className="text-2xl font-black text-green-600 mb-1">
                  {tasks?.filter((t: any) => t.status === 'DONE').length || 0}
                </div>
                <div className="text-sm text-text-light">Erledigt</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'team' && (
        <div className="bg-white rounded-2xl p-6 shadow border border-border">
          <h2 className="text-xl font-bold text-dark mb-4">Team-Performance</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={teamPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tasks" fill="#6366f1" name="Aufgaben" />
              <Bar dataKey="completed" fill="#10b981" name="Erledigt" />
              <Bar dataKey="performance" fill="#8b5cf6" name="Performance %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {reportType === 'financial' && (
        <div className="bg-white rounded-2xl p-6 shadow border border-border">
          <h2 className="text-xl font-bold text-dark mb-4">Finanz-Report</h2>
          {financialData && financialData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Umsatz" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Ausgaben" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-text-light">
              Keine Finanzdaten für den ausgewählten Zeitraum verfügbar
            </div>
          )}
        </div>
      )}
    </div>
  );
}
