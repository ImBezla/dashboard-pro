import Link from 'next/link';
import {
  CoAccountHealthIndicator,
  CoAccountStatusBadge,
  CoActivityTimeline,
  CoDataTable,
  CoJobStatusBadge,
  CoKpiCard,
  CoPriorityBadge,
  CoProcessStatusBadge,
  CoSectionHeader,
} from '@/components/content-ops/primitives';
import {
  mockAccounts,
  mockContent,
  mockJobs,
  mockLogs,
  mockProcesses,
} from '@/lib/content-ops/mock-data';
import { formatDateTime, formatNumber, formatRelative } from '@/lib/content-ops/format';

export default function ContentOperationsOverviewPage() {
  const runningJobs = mockJobs.filter((j) => j.status === 'running').length;
  const blocked = mockProcesses.filter(
    (p) => p.status === 'blocked' || p.status === 'failed',
  ).length;
  const accountsWarn = mockAccounts.filter((a) => a.status !== 'active').length;

  const timeline = mockLogs.slice(0, 5).map((l) => ({
    id: l.id,
    title: l.message,
    time: l.timestamp,
    detail: l.entityType,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Kontrollzentrum</p>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Live-Überblick über Konten, Pipelines und Automationen (Mock-Daten, nur UI).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CoKpiCard
          label="Aktive Prozesse"
          value={String(mockProcesses.filter((p) => p.status === 'running').length)}
          hint={`${blocked} blockiert / fehlgeschlagen`}
        />
        <CoKpiCard
          label="Konten mit Aufmerksamkeit"
          value={String(accountsWarn)}
          trend={{
            direction: accountsWarn > 0 ? 'down' : 'flat',
            text: 'Ziel: 0',
          }}
        />
        <CoKpiCard
          label="Jobs laufend"
          value={String(runningJobs)}
          hint={`${mockJobs.length} Jobs gesamt`}
        />
        <CoKpiCard
          label="Content unterwegs"
          value={String(
            mockContent.filter((c) => !['published', 'failed', 'idea'].includes(c.stage)).length,
          )}
          hint="ohne Idee & terminal"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <CoSectionHeader
            title="Prozesse"
            description="Wichtigste operative Arbeiten."
            action={
              <Link
                href="/content-operations/processes"
                className="text-xs font-medium text-sky-400 hover:underline"
              >
                Alle anzeigen
              </Link>
            }
          />
          <CoDataTable
            rows={mockProcesses.slice(0, 5)}
            columns={[
              {
                id: 'title',
                header: 'Titel',
                cell: (r) => <span className="font-medium text-zinc-100">{r.title}</span>,
              },
              {
                id: 'status',
                header: 'Status',
                width: '120px',
                cell: (r) => <CoProcessStatusBadge status={r.status} />,
              },
              {
                id: 'pri',
                header: 'Prio',
                width: '88px',
                cell: (r) => <CoPriorityBadge priority={r.priority} />,
              },
              {
                id: 'updated',
                header: 'Aktualisiert',
                width: '120px',
                cell: (r) => (
                  <span className="font-mono text-xs text-zinc-400">
                    {formatRelative(r.updatedAt)}
                  </span>
                ),
              },
            ]}
          />
        </section>

        <section>
          <CoSectionHeader
            title="Konten"
            description="Health und Status der Instagram-Properties."
            action={
              <Link
                href="/content-operations/accounts"
                className="text-xs font-medium text-sky-400 hover:underline"
              >
                Verwalten
              </Link>
            }
          />
          <CoDataTable
            rows={mockAccounts}
            columns={[
              {
                id: 'name',
                header: 'Account',
                cell: (r) => <span className="font-medium text-zinc-100">{r.name}</span>,
              },
              {
                id: 'status',
                header: 'Status',
                width: '110px',
                cell: (r) => <CoAccountStatusBadge status={r.status} />,
              },
              {
                id: 'health',
                header: 'Health',
                width: '120px',
                cell: (r) => <CoAccountHealthIndicator score={r.healthScore} />,
              },
              {
                id: 'fol',
                header: 'Follower',
                width: '100px',
                cell: (r) => (
                  <span className="font-mono text-xs text-zinc-400">
                    {r.followers != null ? formatNumber(r.followers) : '—'}
                  </span>
                ),
              },
            ]}
          />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <CoSectionHeader
            title="Automationen"
            description="Letzte Job-States — Steuerung unter Automationen."
            action={
              <Link
                href="/content-operations/automations"
                className="text-xs font-medium text-sky-400 hover:underline"
              >
                Öffnen
              </Link>
            }
          />
          <CoDataTable
            rows={mockJobs.slice(0, 6)}
            columns={[
              {
                id: 'name',
                header: 'Job',
                cell: (r) => <span className="text-zinc-100">{r.name}</span>,
              },
              {
                id: 'type',
                header: 'Typ',
                width: '100px',
                cell: (r) => (
                  <span className="text-xs uppercase text-zinc-500">{r.type}</span>
                ),
              },
              {
                id: 'st',
                header: 'Status',
                width: '110px',
                cell: (r) => <CoJobStatusBadge status={r.status} />,
              },
              {
                id: 'next',
                header: 'Nächster Lauf',
                width: '130px',
                cell: (r) => (
                  <span className="font-mono text-xs text-zinc-400">
                    {r.nextRunAt ? formatDateTime(r.nextRunAt) : '—'}
                  </span>
                ),
              },
            ]}
          />
        </section>
        <section className="rounded-lg border border-zinc-700/80 bg-zinc-900/40 p-4">
          <CoSectionHeader title="Aktivität" description="Neueste System- und Entitäts-Events." />
          <CoActivityTimeline items={timeline} />
        </section>
      </div>
    </div>
  );
}
