import Link from 'next/link';
import { getSiteUrl, SITE_DESCRIPTION_DE, SITE_NAME } from '@/lib/site-url';
import {
  LANDING_FAQS,
  LANDING_LONG_SUMMARY_DE,
  LANDING_USE_CASES,
} from '@/lib/landing/marketing-copy';

/**
 * Servergerenderter Text — auch ohne JavaScript und für KI-/Suchsysteme gut erfassbar.
 * Ergänzt die interaktive Landing-Page (Client); Inhalt entspricht /llms.txt und JSON-LD-Quellen.
 */
export function HomeMachineReadableSection() {
  const base = getSiteUrl().replace(/\/$/, '');
  return (
    <section
      id="textfassung"
      className="border-t border-slate-200 bg-slate-50 text-slate-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
      aria-labelledby="textfassung-heading"
    >
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <h2 id="textfassung-heading" className="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          {SITE_NAME} — Textfassung
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          Kurzfassung für Suchmaschinen und Hilfssysteme. Vollständige Rohfassung auch als{' '}
          <Link href="/llms.txt" className="font-medium text-primary underline-offset-2 hover:underline">
            llms.txt
          </Link>
          .
        </p>

        <article className="mt-8 space-y-8 text-sm leading-relaxed">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Überblick</h3>
            <p className="mt-2">{SITE_DESCRIPTION_DE}</p>
            <p className="mt-3">{LANDING_LONG_SUMMARY_DE}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Einsatzbereiche</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {LANDING_USE_CASES.map((u) => (
                <li key={u.k}>
                  <strong>{u.k}</strong> — {u.t} {u.d}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Häufige Fragen</h3>
            <dl className="mt-3 space-y-4">
              {LANDING_FAQS.map((f) => (
                <div key={f.q}>
                  <dt className="font-semibold text-slate-900 dark:text-zinc-100">{f.q}</dt>
                  <dd className="mt-1 text-slate-600 dark:text-zinc-400">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>

          <nav aria-label="Wichtige Links" className="border-t border-slate-200 pt-6 dark:border-zinc-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Links</h3>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <li>
                <Link className="text-primary underline-offset-2 hover:underline" href="/register">
                  Registrieren
                </Link>
              </li>
              <li>
                <Link className="text-primary underline-offset-2 hover:underline" href="/login">
                  Anmelden
                </Link>
              </li>
              <li>
                <Link className="text-primary underline-offset-2 hover:underline" href="/impressum">
                  Impressum
                </Link>
              </li>
              <li>
                <Link className="text-primary underline-offset-2 hover:underline" href="/datenschutz">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link className="text-primary underline-offset-2 hover:underline" href="/agb">
                  AGB
                </Link>
              </li>
              <li>
                <a className="text-primary underline-offset-2 hover:underline" href={`${base}/sitemap.xml`}>
                  Sitemap
                </a>
              </li>
            </ul>
          </nav>
        </article>
      </div>
    </section>
  );
}
