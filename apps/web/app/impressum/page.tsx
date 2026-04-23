import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';
import { SUPPORT_EMAIL } from '@/lib/site-url';

export const metadata: Metadata = buildPageMetadata({
  title: 'Impressum',
  description:
    'Impressum und Anbieterkennzeichnung für Dashboard Pro (Northgate Corporate GmbH).',
  path: '/impressum',
  keywords: ['Impressum', 'Anbieter', 'Northgate Corporate GmbH', 'Dashboard Pro'],
});

export default function ImpressumPage() {
  return (
    <LegalPageLayout current="impressum">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-black text-dark dark:text-white">Impressum</h1>
        <p className="mt-2 text-sm text-text-light">
          Angaben gemäß § 5 TMG und weiterer Hinweise.
        </p>

        <section className="mt-10 space-y-8 text-sm leading-relaxed text-text sm:text-base">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Angaben gemäß § 5 TMG
            </h2>
            <p className="mt-3 whitespace-pre-line font-medium text-dark dark:text-zinc-100">
              {`Northgate Corporate GmbH

Salvatorstraße 11
85290 Geisenfeld
Deutschland`}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Vertreten durch den Geschäftsführer
            </h2>
            <p className="mt-3 text-dark dark:text-zinc-100">Valentin Maria Oeder</p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Kontakt</h2>
            <p className="mt-3">
              E-Mail:{' '}
              <a
                className="font-medium text-primary underline-offset-2 hover:underline"
                href="mailto:info@northgatecorp.com"
              >
                info@northgatecorp.com
              </a>
            </p>
            <p className="mt-2 text-text-light">
              Support und Hilfe zu Dashboard Pro:{' '}
              <a
                className="font-medium text-primary underline-offset-2 hover:underline"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Handelsregister
            </h2>
            <p className="mt-3 whitespace-pre-line text-dark dark:text-zinc-100">
              {`Registergericht: Amtsgericht Ingolstadt

Registernummer: HRB 12823`}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG
            </h2>
            <p className="mt-3 text-text-light italic">
              [wird ergänzt, sobald vorhanden]
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              EU-Streitschlichtung
            </h2>
            <p className="mt-3 text-text-light">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
              bereit:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-medium text-primary underline-offset-2 hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="mt-2 text-text-light">
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Verbraucherstreitbeilegung / Universalschlichtungsstelle
            </h2>
            <p className="mt-3 text-text-light">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
            </h2>
            <p className="mt-3 whitespace-pre-line text-dark dark:text-zinc-100">
              {`Valentin Maria Oeder

Salvatorstraße 11
85290 Geisenfeld`}
            </p>
          </div>
        </section>
      </article>
    </LegalPageLayout>
  );
}
