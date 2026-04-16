import { notFound } from 'next/navigation';
import { opsProjectById } from '@/lib/operations-os/seed-mock';
import { OpsOsProjectLogsClient } from '@/components/operations-os/project/ProjectLogsClient';

export default function OperationsOsProjectLogsPage({ params }: { params: { id: string } }) {
  const p = opsProjectById(params.id);
  if (!p) notFound();
  return <OpsOsProjectLogsClient projectId={p.id} />;
}
