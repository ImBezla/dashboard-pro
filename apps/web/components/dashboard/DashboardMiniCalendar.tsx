'use client';

import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';
import api from '@/lib/api';

export function DashboardMiniCalendar() {
  const now = new Date();
  const rangeStart = startOfMonth(now);
  const rangeEnd = endOfMonth(now);

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-mini', rangeStart.toISOString()],
    queryFn: async () => {
      const r = await api.get('/calendar', {
        params: {
          start: rangeStart.toISOString(),
          end: rangeEnd.toISOString(),
        },
      });
      return (r.data || []) as {
        id: string;
        title: string;
        startDate: string;
        endDate?: string | null;
      }[];
    },
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const upcoming = (events || [])
    .filter((e) => new Date(e.startDate) >= startOfToday)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-border min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="text-lg font-semibold text-dark">Kalender</div>
          <div className="text-xs text-text-light">
            {format(rangeStart, 'MMMM yyyy', { locale: de })}
          </div>
        </div>
        <Link
          href="/calendar"
          className="text-primary hover:text-primary-dark text-sm font-medium"
        >
          Öffnen →
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : upcoming.length === 0 ? (
        <p className="text-sm text-text-light py-4 text-center">
          Keine Termine in diesem Monat.
        </p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((ev) => {
            const d = new Date(ev.startDate);
            return (
              <li
                key={ev.id}
                className="flex gap-3 items-start p-2 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="text-xs font-semibold text-primary w-14 shrink-0">
                  {isSameDay(d, new Date())
                    ? 'Heute'
                    : format(d, 'EEE d.', { locale: de })}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-dark truncate">
                    {ev.title}
                  </div>
                  <div className="text-xs text-text-light">
                    {format(d, 'HH:mm', { locale: de })} Uhr
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
