'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import api from '@/lib/api';

interface TimeTrackerProps {
  taskId?: string;
  projectId?: string;
}

export function TimeTracker({ taskId, projectId }: TimeTrackerProps) {
  const queryClient = useQueryClient();
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const queryKey = taskId 
    ? ['time-entries', 'task', taskId]
    : projectId 
    ? ['time-entries', 'project', projectId]
    : ['time-entries'];

  const { data: entries, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const endpoint = taskId 
        ? `/time-entries/task/${taskId}`
        : projectId 
        ? `/time-entries/project/${projectId}`
        : '/time-entries';
      const response = await api.get(endpoint);
      return response.data || [];
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (duration: number) => {
      await api.post('/time-entries', {
        description: description || undefined,
        duration,
        taskId,
        projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      setDescription('');
      setManualMinutes('');
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/time-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const startTracking = () => {
    setIsTracking(true);
    setStartTime(new Date());
    setElapsed(0);
  };

  const stopTracking = () => {
    setIsTracking(false);
    const minutes = Math.ceil(elapsed / 60);
    if (minutes > 0) {
      createEntryMutation.mutate(minutes);
    }
    setStartTime(null);
    setElapsed(0);
  };

  const addManualEntry = () => {
    const mins = parseInt(manualMinutes);
    if (mins > 0) {
      createEntryMutation.mutate(mins);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const totalMinutes = entries?.reduce((sum: number, e: any) => sum + e.duration, 0) || 0;

  return (
    <div className="bg-white rounded-xl border border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-dark flex items-center gap-2">
            ⏱️ Zeiterfassung
            {totalMinutes > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {formatMinutes(totalMinutes)} gesamt
              </span>
            )}
          </h4>
        </div>
      </div>

      {/* Timer */}
      <div className="p-4 border-b border-border bg-slate-50">
        {isTracking ? (
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-primary mb-3">
              {formatDuration(elapsed)}
            </div>
            <button
              onClick={stopTracking}
              className="bg-danger text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              ⏹️ Stoppen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was arbeitest du? (optional)"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={startTracking}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                ▶️ Timer starten
              </button>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  placeholder="Min."
                  className="w-16 px-2 py-2 border border-border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={addManualEntry}
                  disabled={!manualMinutes || parseInt(manualMinutes) <= 0}
                  className="bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-300 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="max-h-[250px] overflow-y-auto divide-y divide-border">
        {isLoading ? (
          <div className="p-4 text-center text-text-light text-sm">Lädt...</div>
        ) : entries && entries.length > 0 ? (
          entries.slice(0, 10).map((entry: any) => (
            <div key={entry.id} className="p-3 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary text-sm">
                      {formatMinutes(entry.duration)}
                    </span>
                    <span className="text-xs text-text-light">
                      {format(new Date(entry.date), 'dd.MM.yy', { locale: de })}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="text-xs text-text-light truncate mt-0.5">{entry.description}</p>
                  )}
                  {entry.user?.name && (
                    <p className="text-xs text-primary/70">{entry.user.name}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (confirm('Zeiteintrag löschen?')) {
                      deleteEntryMutation.mutate(entry.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 text-danger text-xs transition-opacity"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-text-light text-sm">
            Keine Zeiteinträge
          </div>
        )}
      </div>
    </div>
  );
}
