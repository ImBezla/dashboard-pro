import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/site-url';

export type LegalNavId = 'impressum' | 'datenschutz' | 'agb';

const LEGAL_LINKS: { id: LegalNavId; href: string; label: string }[] = [
  { id: 'impressum', href: '/impressum', label: 'Impressum' },
  { id: 'datenschutz', href: '/datenschutz', label: 'Datenschutz' },
  { id: 'agb', href: '/agb', label: 'AGB' },
];

export function LegalProjectNotice() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
      <p className="rounded-xl border border-border bg-white/80 px-4 py-3 text-sm leading-relaxed text-text shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200">
        <span className="font-semibold text-dark dark:text-white">Dashboard Pro</span> ist ein
        Projekt der{' '}
        <span className="font-semibold text-dark dark:text-white">Northgate Corporate GmbH</span>
        . Vollständige Anbieter- und Kontaktdaten sowie Registerangaben stehen im{' '}
        <Link href="/impressum" className="font-medium text-primary underline-offset-2 hover:underline">
          Impressum
        </Link>
        . Support:{' '}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-primary underline-offset-2 hover:underline break-all"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}

export function LegalPageLayout({
  current,
  children,
}: {
  current: LegalNavId;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-light text-text">
      <header className="border-b border-border bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-[var(--bg-card)]/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="shrink-0" aria-label="Zur Startseite">
              <img
                src="/brand/logo-wordmark.svg"
                alt="Dashboard Pro"
                width={200}
                height={40}
                className="h-7 w-auto sm:h-8"
                decoding="async"
              />
            </Link>
            <Link
              href="/"
              className="hidden text-sm font-semibold text-primary underline-offset-2 hover:underline sm:inline"
            >
              Zur Startseite
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/register"
              className="hidden text-sm font-semibold text-text-light hover:text-primary sm:inline"
            >
              Registrieren
            </Link>
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-text-light hover:text-primary sm:inline"
            >
              Anmelden
            </Link>
            <div className="flex items-center gap-2 sm:hidden">
              <Link
                href="/login"
                className="text-sm font-semibold text-text-light hover:text-primary"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                Start
              </Link>
            </div>
          </div>
        </div>
        <nav
          aria-label="Rechtliche Seiten"
          className="mx-auto max-w-3xl border-t border-border/60 px-4 py-3 sm:px-6 dark:border-zinc-800/80"
        >
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {LEGAL_LINKS.map(({ id, href, label }) => (
              <li key={id}>
                <Link
                  href={href}
                  className={
                    id === current
                      ? 'font-bold text-primary'
                      : 'font-medium text-text-light hover:text-primary'
                  }
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <LegalProjectNotice />

      {children}
    </div>
  );
}
