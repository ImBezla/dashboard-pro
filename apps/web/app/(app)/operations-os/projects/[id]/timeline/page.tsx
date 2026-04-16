import { notFound } from 'next/navigation';
import { getOpsOsStore, opsProjectById } from '@/lib/operations-os/seed-mock';
import { OpsOsSection } from '@/components/operations-os/ui/ops-ui';
import { OpsOsTimeline } from '@/components/operations-os/ui/OpsTimeline';

export default function OperationsOsProjectTimelinePage({ params }: { params: { id: string } }) {
  const p = opsProjectById(params.id);
  if (!p) notFound();
  const s = getOpsOsStore();
  const milestones = s.milestones.filter((m) => m.projectId === p.id);
  const logs = s.logs
    .filter(
      (l) =>
        l.entityId === p.id ||
        s.flows.some((f) => f.projectId === p.id && f.id === l.entityId) ||
        s.tasks.some((t) => t.projectId === p.id && t.id === l.entityId) ||
        s.documents.some((d) => d.projectId === p.id && d.id === l.entityId),
    )
    .slice(0, 40);

  return (
    <div className="space-y-4">
      <OpsOsSection
        title="Timeline"
        description="Meilensteine und kombinierte Aktivität (Dokumente, Tasks, Flows)."
      />
      <OpsOsTimeline milestones={milestones} logs={logs} />
    </div>
  );
}
