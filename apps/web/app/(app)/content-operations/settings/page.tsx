import { CoSectionHeader } from '@/components/content-ops/primitives';

export default function CoSettingsPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <CoSectionHeader
        title="Einstellungen"
        description="Workspace-Defaults für Content Operations (statisches Mock-Formular)."
      />

      <section className="rounded-lg border border-zinc-700/80 bg-zinc-900/40 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">Publishing-Fenster</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Regionale Posting-Fenster und harte Stopps.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-zinc-500">
            Primär-Zeitzone
            <select className="mt-1 w-full rounded-md border border-zinc-600 bg-zinc-950 px-2 py-2 text-sm text-zinc-100">
              <option>Europe/Berlin</option>
              <option>America/New_York</option>
              <option>Asia/Singapore</option>
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-500">
            Max. Posts / Tag / Konto
            <input
              type="number"
              defaultValue={6}
              className="mt-1 w-full rounded-md border border-zinc-600 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-700/80 bg-zinc-900/40 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">Moderation</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Keyword-Listen und Auto-Aktionen — hier nur Demo.
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm text-zinc-200">
          <input type="checkbox" defaultChecked className="rounded border-zinc-600" />
          Kommentare über Toxicity-Schwelle automatisch ausblenden
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm text-zinc-200">
          <input type="checkbox" className="rounded border-zinc-600" />
          Flagged DMs an On-Call-Inbox
        </label>
      </section>

      <section className="rounded-lg border border-zinc-700/80 bg-zinc-900/40 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">API & Integrationen</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Secrets in eurer echten Umgebung rotieren — in dieser Demo nichts gespeichert.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-100 hover:border-zinc-500"
        >
          Key-Rotation simulieren
        </button>
      </section>
    </div>
  );
}
