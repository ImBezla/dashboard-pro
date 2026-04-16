import Link from 'next/link';

type Props = {
  className?: string;
  variant?: 'default' | 'light';
  /** Wenn true: für Nutzung innerhalb eines Links (z. B. Home-Link), vermeidet doppelte SR-Beschriftung. */
  decorative?: boolean;
};

/**
 * Inline-SVG-Wortmarke (kein <img src="/brand/…">).
 * SVG mit <text> als externe Bild-URL wird in Chrome/Safari oft leer dargestellt.
 */
export function DashboardProWordmark({
  className,
  variant = 'default',
  decorative,
}: Props) {
  const isLight = variant === 'light';
  const markFill = isLight ? '#818cf8' : '#6366f1';
  const wordFill = isLight ? '#f8fafc' : '#0f172a';
  const proFill = isLight ? '#a5b4fc' : '#6366f1';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 40"
      fill="none"
      className={className}
      {...(decorative
        ? { 'aria-hidden': true as const }
        : { role: 'img' as const, 'aria-label': 'Dashboard Pro' })}
    >
      {!decorative ? <title>Dashboard Pro</title> : null}
      <rect x="0" y="4" width="32" height="32" rx="8" fill={markFill} />
      <rect x="7" y="21" width="4.5" height="9" rx="1.25" fill="#fff" opacity={0.92} />
      <rect x="13.75" y="16" width="4.5" height="14" rx="1.25" fill="#fff" opacity={0.95} />
      <rect x="20.5" y="10" width="4.5" height="20" rx="1.25" fill="#fff" />
      {/* Ein <text>: PRO sitzt direkt nach „Dashboard“ (dx), kein fixer Abstand */}
      <text
        x="40"
        y="28"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      >
        <tspan fill={wordFill} fontSize="19" fontWeight="700" letterSpacing="-0.02em">
          Dashboard
        </tspan>
        <tspan
          fill={proFill}
          fontSize="13"
          fontWeight="800"
          letterSpacing="0.06em"
          dx="5"
        >
          PRO
        </tspan>
      </text>
    </svg>
  );
}

type HomeLinkProps = Pick<Props, 'className' | 'variant'> & {
  /** Klassen für das SVG (z. B. `h-10 w-auto`). Standard: `h-9 w-auto`. */
  wordmarkClassName?: string;
};

/** Wortmarke als Link zur Startseite (`/`). */
export function DashboardProWordmarkHomeLink({
  className,
  variant = 'default',
  wordmarkClassName = 'h-9 w-auto',
}: HomeLinkProps) {
  return (
    <Link
      href="/"
      aria-label="Zur Startseite"
      className={`inline-block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className ?? ''}`.trim()}
    >
      <DashboardProWordmark
        className={`block ${wordmarkClassName}`.trim()}
        variant={variant}
        decorative
      />
    </Link>
  );
}
