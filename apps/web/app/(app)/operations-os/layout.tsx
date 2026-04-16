import '@xyflow/react/dist/style.css';
import { OpsOsShell } from '@/components/operations-os/OpsOsShell';

export default function OperationsOsLayout({ children }: { children: React.ReactNode }) {
  return <OpsOsShell>{children}</OpsOsShell>;
}
