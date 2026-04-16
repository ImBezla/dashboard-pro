'use client';

import { useCallback, useState } from 'react';
import { CoSectionHeader, CoWorkflowCard } from '@/components/content-ops/primitives';
import { mockAccounts, mockJobs } from '@/lib/content-ops/mock-data';
import type { AutomationJob, JobStatus } from '@/lib/content-ops/types';
import { formatDateTime, formatPercent } from '@/lib/content-ops/format';

function cloneJobs(): AutomationJob[] {
  return mockJobs.map((j) => ({ ...j }));
}

export default function CoAutomationsPage() {
  const [jobs, setJobs] = useState(cloneJobs);
  const [logLines, setLogLines] = useState<string[]>([]);

  const pushLog = useCallback((line: string) => {
    setLogLines((prev) => [line, ...prev].slice(0, 12));
  }, []);

  const setStatus = (id: string, status: JobStatus) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
    pushLog(`[${id}] Status → ${status}`);
  };

  return (
    <div className="space-y-4">
      <CoSectionHeader
        title="Automationen"
        description="Jobs pro Konto mit Steuerung (Mock-State, nur UI)."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        {jobs.map((job) => {
          const acc =
            mockAccounts.find((a) => a.id === job.accountId)?.name ?? job.accountId;
          const canPause = job.status === 'running' || job.status === 'queued';
          const canResume = job.status === 'paused';

          return (
            <CoWorkflowCard
              key={job.id}
              name={job.name}
              type={job.type}
              status={job.status}
              meta={
                <>
                  <div>
                    <span className="text-zinc-500">Konto:</span>{' '}
                    <span className="text-zinc-200">{acc}</span>
                  </div>
                  <div className="font-mono text-[11px]">
                    Zuletzt: {job.lastRunAt ? formatDateTime(job.lastRunAt) : '—'} · Nächster:{' '}
                    {job.nextRunAt ? formatDateTime(job.nextRunAt) : '—'}
                  </div>
                  <div>
                    Erfolg{' '}
                    {job.successRate != null ? formatPercent(job.successRate) : '—'} · Fehler{' '}
                    {job.errorRate != null ? formatPercent(job.errorRate) : '—'}
                  </div>
                  {job.lastError && (
                    <div className="text-red-400">Letzter Fehler: {job.lastError}</div>
                  )}
                </>
              }
              actions={
                <>
                  {canPause && (
                    <button
                      type="button"
                      className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-100 hover:border-zinc-500"
                      onClick={() => setStatus(job.id, 'paused')}
                    >
                      Pause
                    </button>
                  )}
                  {canResume && (
                    <button
                      type="button"
                      className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-100 hover:border-zinc-500"
                      onClick={() => setStatus(job.id, 'queued')}
                    >
                      Fortsetzen
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-100 hover:border-zinc-500"
                    onClick={() =>
                      pushLog(
                        `[${job.id}] log — ${job.lastError ?? 'keine Fehler im Puffer (Mock)'}`,
                      )
                    }
                  >
                    Log
                  </button>
                </>
              }
            />
          );
        })}
      </div>

      {logLines.length > 0 && (
        <div className="rounded-lg border border-zinc-700/80 bg-zinc-900/50 p-3 font-mono text-[11px] text-zinc-400">
          <div className="mb-2 text-xs font-semibold text-zinc-200">Aktions-Log</div>
          <ul className="space-y-1">
            {logLines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
