'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '@/lib/api';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      try {
        const response = await api.get('/activity?limit=100');
        // Get read activities from localStorage
        const readActivities = JSON.parse(localStorage.getItem('readActivities') || '[]');
        // Consider activities from last 24 hours as "unread" if not explicitly marked as read
        const last24Hours = new Date();
        last24Hours.setHours(last24Hours.getHours() - 24);
        
        return (response.data || []).map((activity: any) => {
          const isExplicitlyRead = readActivities.includes(activity.id);
          const isOld = new Date(activity.createdAt) < last24Hours;
          return {
            ...activity,
            read: isExplicitlyRead || isOld,
          };
        });
      } catch (error: any) {
        console.error('Failed to load activities:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return [];
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (activityId: string) => {
      // Store read status in localStorage for now
      // In the future, this could be stored in the database
      const readActivities = JSON.parse(localStorage.getItem('readActivities') || '[]');
      if (!readActivities.includes(activityId)) {
        readActivities.push(activityId);
        localStorage.setItem('readActivities', JSON.stringify(readActivities));
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // Mark all current activities as read
      const allActivityIds = activities?.map((a: any) => a.id) || [];
      localStorage.setItem('readActivities', JSON.stringify(allActivityIds));
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const filteredActivities = activities?.filter((activity: any) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !activity.read;
    if (filter === 'read') return activity.read;
    return true;
  });

  const unreadCount = activities?.filter((a: any) => !a.read).length || 0;

  const getActivityIcon = (type: string) => {
    if (type.includes('PROJECT')) return '📁';
    if (type.includes('TASK')) return '✅';
    if (type.includes('TEAM')) return '👥';
    if (type.includes('CUSTOMER')) return '👤';
    if (type.includes('INVOICE') || type.includes('FINANCE')) return '💰';
    return '🔔';
  };

  const getActivityColor = (type: string) => {
    if (type.includes('PROJECT')) return 'bg-blue-100 text-blue-700';
    if (type.includes('TASK')) return 'bg-green-100 text-green-700';
    if (type.includes('TEAM')) return 'bg-purple-100 text-purple-700';
    if (type.includes('CUSTOMER')) return 'bg-amber-100 text-amber-700';
    if (type.includes('INVOICE') || type.includes('FINANCE')) return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PROJECT_CREATED: 'Projekt erstellt',
      PROJECT_UPDATED: 'Projekt aktualisiert',
      TASK_CREATED: 'Aufgabe erstellt',
      TASK_UPDATED: 'Aufgabe aktualisiert',
      TASK_COMPLETED: 'Aufgabe erledigt',
      TEAM_MEMBER_ADDED: 'Team-Mitglied hinzugefügt',
      CUSTOMER_CREATED: 'Kunde angelegt',
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  const groupedActivities = useMemo(() => {
    if (!filteredActivities?.length) return { today: [], yesterday: [], older: [] };
    const today: any[] = [];
    const yesterday: any[] = [];
    const older: any[] = [];
    const now = new Date();
    filteredActivities.forEach((a: any) => {
      const d = new Date(a.createdAt);
      if (isToday(d)) today.push(a);
      else if (isYesterday(d)) yesterday.push(a);
      else older.push(a);
    });
    return { today, yesterday, older };
  }, [filteredActivities]);

  const renderGroup = (title: string, items: any[]) => {
    if (!items.length) return null;
    return (
      <div key={title} className="mb-6 last:mb-0">
        <h2 className="text-xs font-bold text-text-light uppercase tracking-wider px-4 py-2 sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10">
          {title}
        </h2>
        <div className="divide-y divide-border">
          {items.map((activity: any) => {
            const timeAgo = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: de });
            const fullDate = format(new Date(activity.createdAt), "EEEE, d. MMMM yyyy 'um' HH:mm", { locale: de });
            return (
              <div
                key={activity.id}
                className={`px-4 py-4 sm:px-6 sm:py-5 hover:bg-slate-50/80 transition-colors ${
                  !activity.read ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${getActivityColor(activity.type)}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-dark leading-snug text-[15px] sm:text-base">
                      {activity.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-text-light">
                      <span title={fullDate}>{timeAgo}</span>
                      {activity.user?.name && (
                        <>
                          <span className="text-text-light/50">·</span>
                          <span className="text-primary font-medium">{activity.user.name}</span>
                        </>
                      )}
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${getActivityColor(activity.type)}`}>
                        {getActivityTypeLabel(activity.type)}
                      </span>
                    </div>
                    {!activity.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(activity.id);
                        }}
                        disabled={markAsReadMutation.isPending}
                        className="mt-3 text-primary hover:text-primary-dark text-sm font-semibold py-1.5 px-2 -ml-2 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 touch-manipulation min-h-[36px]"
                      >
                        Als gelesen markieren
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-w-0" data-tour="page-notifications">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-dark mb-1">Benachrichtigungen</h1>
          <p className="text-sm sm:text-base text-text-light">
            Alle Aktivitäten zu Projekten, Aufgaben und Team
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="bg-primary text-white px-4 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] touch-manipulation w-full sm:w-auto"
          >
            {markAllAsReadMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Wird markiert…</span>
              </>
            ) : (
              <>Alle als gelesen ({unreadCount})</>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'unread', 'read'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors touch-manipulation min-h-[44px] ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-text hover:bg-slate-50'
            }`}
          >
            {f === 'all' && `Alle (${activities?.length || 0})`}
            {f === 'unread' && `Ungelesen (${unreadCount})`}
            {f === 'read' && `Gelesen (${(activities?.length || 0) - unreadCount})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-light font-medium">Lädt Benachrichtigungen…</p>
          </div>
        ) : error ? (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-red-600 font-semibold mb-4">Fehler beim Laden</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['activities'] })}
              className="bg-primary text-white px-5 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors min-h-[44px] touch-manipulation"
            >
              Erneut versuchen
            </button>
          </div>
        ) : filteredActivities && filteredActivities.length > 0 ? (
          <div className="py-2">
            {renderGroup('Heute', groupedActivities.today)}
            {renderGroup('Gestern', groupedActivities.yesterday)}
            {renderGroup('Älter', groupedActivities.older)}
          </div>
        ) : (
          <div className="p-10 sm:p-14 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-slate-100 flex items-center justify-center text-4xl">
              🔔
            </div>
            <p className="font-bold text-dark text-lg mb-2">Keine Benachrichtigungen</p>
            <p className="text-text-light text-sm max-w-sm mx-auto">
              {filter === 'unread'
                ? 'Sie haben alle Benachrichtigungen gelesen.'
                : filter === 'read'
                  ? 'Noch keine gelesenen Benachrichtigungen.'
                  : 'Hier erscheinen neue Aktivitäten zu Projekten, Aufgaben und Team.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
