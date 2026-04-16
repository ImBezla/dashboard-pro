import { CoChartContainer, CoKpiCard, CoSectionHeader } from '@/components/content-ops/primitives';
import { mockAccounts, mockContent, mockJobs } from '@/lib/content-ops/mock-data';
import { formatPercent } from '@/lib/content-ops/format';

function BarChart({
  data,
}: {
  data: { label: string; value: number; max: number }[];
}) {
  return (
    <div className="flex h-full flex-col justify-end gap-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3 text-xs">
          <span className="w-24 shrink-0 truncate text-zinc-500">{d.label}</span>
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded bg-zinc-800">
            <div
              className="h-full rounded bg-sky-500/70"
              style={{ width: `${(d.value / d.max) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-zinc-400">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function CoAnalyticsPage() {
  const published = mockContent.filter((c) => c.stage === 'published').length;
  const failed = mockContent.filter((c) => c.stage === 'failed').length;
  const avgHealth =
    mockAccounts.reduce((s, a) => s + a.healthScore, 0) / mockAccounts.length;
  const withEr = mockAccounts.filter((a) => a.engagementRate != null);
  const avgEr =
    withEr.reduce((s, a) => s + (a.engagementRate ?? 0), 0) / Math.max(1, withEr.length);

  const byAccount = mockAccounts.map((a) => ({
    label: a.name.replace('@', ''),
    value: mockContent.filter((c) => c.accountId === a.id).length,
    max: Math.max(
      1,
      ...mockAccounts.map((x) => mockContent.filter((c) => c.accountId === x.id).length),
    ),
  }));

  const jobSuccess = mockJobs
    .filter((j) => j.successRate != null)
    .map((j) => ({
      label: j.type,
      value: Math.round(j.successRate ?? 0),
      max: 100,
    }));

  return (
    <div className="space-y-6">
      <CoSectionHeader
        title="Analytics"
        description="Aggregierte Signale — später an euer Warehouse anbinden."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CoKpiCard label="Ø Health-Score" value={avgHealth.toFixed(0)} />
        <CoKpiCard label="Ø Engagement" value={formatPercent(avgEr || 0)} />
        <CoKpiCard label="Veröffentlicht (Mock)" value={String(published)} />
        <CoKpiCard label="Fehlgeschlagen" value={String(failed)} hint="Pipeline terminal" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CoChartContainer title="Content-Volumen pro Konto" subtitle="Einträge im Mock-Dataset">
          <BarChart data={byAccount} />
        </CoChartContainer>
        <CoChartContainer
          title="Job-Erfolgsquote"
          subtitle="Gerundete Erfolgs-% (Mock)"
        >
          <BarChart data={jobSuccess} />
        </CoChartContainer>
      </div>
    </div>
  );
}
