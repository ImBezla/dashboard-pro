import { ContentOpsShell } from '@/components/content-ops/ContentOpsShell';

export default function ContentOperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ContentOpsShell>{children}</ContentOpsShell>;
}
