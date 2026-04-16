'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '@/lib/api';

const getActivityIcon = (type: string) => {
  if (type.includes('PROJECT')) return { icon: '📁', color: 'bg-blue-100 text-blue-600' };
  if (type.includes('TASK')) return { icon: '✅', color: 'bg-green-100 text-green-600' };
  if (type.includes('TEAM') || type.includes('USER')) return { icon: '👥', color: 'bg-purple-100 text-purple-600' };
  if (type.includes('CUSTOMER')) return { icon: '👤', color: 'bg-amber-100 text-amber-600' };
  if (type.includes('CALENDAR') || type.includes('EVENT')) return { icon: '📅', color: 'bg-pink-100 text-pink-600' };
  if (type.includes('INVOICE') || type.includes('FINANCE')) return { icon: '💰', color: 'bg-emerald-100 text-emerald-600' };
  return { icon: '🔔', color: 'bg-gray-100 text-gray-600' };
};

export function ActivityFeed() {
  const router = useRouter();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      try {
        const response = await api.get('/activity?limit=10');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch activities:', error);
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-border min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold text-dark">Aktivitäten</div>
          <div className="flex items-center gap-1 text-success text-xs font-medium">
            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            Live
          </div>
        </div>
        <button
          onClick={() => router.push('/notifications')}
          className="text-primary hover:text-primary-dark text-sm font-medium py-2 px-1 -mr-1 min-h-[44px] flex items-center touch-manipulation"
        >
          Alle anzeigen →
        </button>
      </div>
      
      <div className="space-y-3 max-h-[280px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : activities && activities.length > 0 ? (
          activities.slice(0, 5).map((activity: any, index: number) => {
            const { icon, color } = getActivityIcon(activity.type);
            const timeAgo = formatDistanceToNow(new Date(activity.createdAt), { 
              addSuffix: true, 
              locale: de 
            });
            
            return (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer animate-slideIn"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => router.push('/notifications')}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${color}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="font-medium text-dark text-sm line-clamp-2 break-words">
                    {activity.message}
                  </div>
                  <div className="flex items-center gap-2 mt-1 min-w-0 overflow-hidden">
                    <span className="text-xs text-text-light truncate shrink-0">{timeAgo}</span>
                    {activity.user?.name && (
                      <>
                        <span className="text-xs text-text-light shrink-0">·</span>
                        <span className="text-xs text-primary truncate min-w-0" title={activity.user.name}>{activity.user.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-text-light py-6 text-sm">
            <div className="text-2xl mb-2">📭</div>
            Keine aktuellen Aktivitäten
          </div>
        )}
      </div>
    </div>
  );
}
