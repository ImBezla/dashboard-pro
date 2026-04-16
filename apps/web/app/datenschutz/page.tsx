import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Datenschutz',
  description:
    'Datenschutzerklärung für Dashboard Pro — Verarbeitung personenbezogener Daten, Cookies und Betroffenenrechte.',
  path: '/datenschutz',
  keywords: ['Datenschutz', 'DSGVO', 'Dashboard Pro', 'Northgate Corporate GmbH'],
});

export default function DatenschutzPage() {
  return (
    <LegalPageLayout current="datenschutz">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-black text-dark dark:text-white">Datenschutz</h1>
        <p className="mt-2 text-sm text-text-light">
          Datenschutzerklärung für Dashboard Pro.
        </p>

        <section className="mt-10 space-y-8 text-sm leading-relaxed text-text sm:text-base">
          <div className="rounded-2xl border border-border bg-white/70 p-5 text-text-light dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="font-medium text-dark dark:text-white">
              Hinweis: Diese Seite ist ein Platzhalter und muss vor Livegang rechtlich finalisiert
              werden.
            </p>
            <p className="mt-2">
              Inhalte wie Datenkategorien, Zwecke, Rechtsgrundlagen, Auftragsverarbeiter, Speicherdauern
              und Betroffenenrechte hängen von eurem konkreten Setup (Hosting, Tracking, Mail, Support)
              ab.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Verantwortlicher
            </h2>
            <p className="mt-3 text-text-light">
              Der Verantwortliche im Sinne der DSGVO ist der im{' '}
              <a
                href="/impressum"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Impressum
              </a>{' '}
              genannte Anbieter.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Verarbeitung im Rahmen der Nutzung
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-text-light">
              <li>Account-/Kontakt- und Organisationsdaten (Registrierung, Login, Workspace).</li>
              <li>Nutzungsdaten innerhalb der App (z. B. Aufgaben, Projekte, Aktivitäten).</li>
              <li>Technische Daten (z. B. IP-Adresse, Logfiles) zur Bereitstellung und Sicherheit.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Cookies / Local Storage
            </h2>
            <p className="mt-3 text-text-light">
              Für die Anmeldung werden technisch notwendige Daten (z. B. Session-/Token-Informationen)
              verwendet. Optional eingesetzte Analyse-/Marketing-Tools müssen hier explizit genannt
              werden.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Betroffenenrechte
            </h2>
            <p className="mt-3 text-text-light">
              Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch sowie
              Beschwerderecht bei einer Aufsichtsbehörde.
            </p>
          </div>
        </section>
      </article>
    </LegalPageLayout>
  );
}
