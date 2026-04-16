import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'AGB',
  description:
    'Allgemeine Geschäftsbedingungen (AGB) für die Nutzung von Dashboard Pro.',
  path: '/agb',
  keywords: ['AGB', 'Nutzungsbedingungen', 'Dashboard Pro', 'Northgate Corporate GmbH'],
});

export default function AGBPage() {
  return (
    <LegalPageLayout current="agb">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-black text-dark dark:text-white">AGB</h1>
        <p className="mt-2 text-sm text-text-light">
          Allgemeine Geschäftsbedingungen für Dashboard Pro.
        </p>

        <section className="mt-10 space-y-8 text-sm leading-relaxed text-text sm:text-base">
          <div className="rounded-2xl border border-border bg-white/70 p-5 text-text-light dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="font-medium text-dark dark:text-white">
              Hinweis: Diese Seite ist ein Platzhalter und muss vor Livegang rechtlich finalisiert
              werden.
            </p>
            <p className="mt-2">
              Bitte ergänzt u. a. Leistungsbeschreibung, Preise, Laufzeiten, Kündigung, SLA/Verfügbarkeit,
              Haftung, Gewährleistung, Datenschutz/AVV, Gerichtsstand und Schlussbestimmungen.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Anbieter
            </h2>
            <p className="mt-3 text-text-light">
              Anbieterangaben siehe{' '}
              <a
                href="/impressum"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Impressum
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Vertragsgegenstand
            </h2>
            <p className="mt-3 text-text-light">
              Bereitstellung der Software „Dashboard Pro“ als webbasierte Anwendung.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Pflichten der Nutzer
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-text-light">
              <li>Wahrheitsgemäße Angaben, sichere Passwörter, Schutz von Zugangsdaten.</li>
              <li>Keine rechtswidrigen Inhalte/Handlungen innerhalb der Plattform.</li>
            </ul>
          </div>
        </section>
      </article>
    </LegalPageLayout>
  );
}
