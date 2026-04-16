import { redirect } from 'next/navigation';

export default function OperationsOsProjectIndexPage({ params }: { params: { id: string } }) {
  redirect(`/operations-os/projects/${params.id}/overview`);
}
