import { notFound } from 'next/navigation';
import { opsProjectById } from '@/lib/operations-os/seed-mock';
import { OpsOsProjectNotesClient } from '@/components/operations-os/project/ProjectNotesClient';

export default function OperationsOsProjectNotesPage({ params }: { params: { id: string } }) {
  const p = opsProjectById(params.id);
  if (!p) notFound();
  return <OpsOsProjectNotesClient projectId={p.id} />;
}
