import Link from 'next/link';

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
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-bold text-primary hover:underline">
            ← Zur Startseite
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/register"
              className="text-sm font-semibold text-text-light hover:text-primary"
            >
              Registrieren
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-text-light hover:text-primary"
            >
              Anmelden
            </Link>
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
