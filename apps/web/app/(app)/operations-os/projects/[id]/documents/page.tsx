import { notFound } from 'next/navigation';
import { opsProjectById } from '@/lib/operations-os/seed-mock';
import { OpsOsProjectDocumentsClient } from '@/components/operations-os/project/ProjectDocumentsClient';

export default function OperationsOsProjectDocumentsPage({ params }: { params: { id: string } }) {
  const p = opsProjectById(params.id);
  if (!p) notFound();
  return <OpsOsProjectDocumentsClient projectId={p.id} />;
}
