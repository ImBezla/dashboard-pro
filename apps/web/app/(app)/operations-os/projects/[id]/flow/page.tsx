import { notFound } from 'next/navigation';
import { opsFlowsForProject, opsProjectById } from '@/lib/operations-os/seed-mock';
import { OpsOsProjectFlowClient } from '@/components/operations-os/project/ProjectFlowClient';

export default function OperationsOsProjectFlowPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const p = opsProjectById(params.id);
  if (!p) notFound();
  const flows = opsFlowsForProject(p.id);
  const flowParam = searchParams.flow;
  const initialFlowId = typeof flowParam === 'string' ? flowParam : null;

  return (
    <OpsOsProjectFlowClient
      projectId={p.id}
      flowIds={flows.map((f) => f.id)}
      initialFlowId={initialFlowId}
    />
  );
}
