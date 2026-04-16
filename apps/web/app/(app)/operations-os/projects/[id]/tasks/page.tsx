import { notFound } from 'next/navigation';
import { opsProjectById } from '@/lib/operations-os/seed-mock';
import { OpsOsProjectTasksClient } from '@/components/operations-os/project/ProjectTasksClient';

export default function OperationsOsProjectTasksPage({ params }: { params: { id: string } }) {
  const p = opsProjectById(params.id);
  if (!p) notFound();
  return <OpsOsProjectTasksClient projectId={p.id} />;
}
