'use client';

import { usePathname } from 'next/navigation';

/**
 * Routen mit Marketing-/Auth-/Rechts-Charakter: sanfter Slide-in beim Client-Navigieren
 * (gleiches Gefühl wie Anker-Sprünge auf der Startseite).
 */
const PUBLIC_MARKETING_PATHS = new Set([
  '/',
  '/login',
  '/register',
  '/datenschutz',
  '/agb',
  '/impressum',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]);

function isLegalPath(pathname: string) {
  return pathname === '/datenschutz' || pathname === '/agb' || pathname === '/impressum';
}

export function PublicMarketingRouteEnter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  if (!PUBLIC_MARKETING_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <div key={pathname} className={isLegalPath(pathname) ? 'dp-public-page-enter-legal' : 'dp-public-page-enter'}>
      {children}
    </div>
  );
}
