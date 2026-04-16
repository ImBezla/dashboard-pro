import { OpsOsSection } from '@/components/operations-os/ui/ops-ui';

export default function OperationsOsSettingsPage() {
  return (
    <div className="space-y-6">
      <OpsOsSection
        title="Workspace-Einstellungen"
        description="Platzhalter für Mandanten-Konfiguration, API-Keys und Integrations-Endpunkte."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {['Region', 'Retention Logs', 'SSO', 'Webhook-Basis-URL', 'Feature-Flags', 'Benachrichtigungen'].map(
          (label) => (
            <div key={label} className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
              {label}: <span className="font-mono text-zinc-600">mock / nicht konfiguriert</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
