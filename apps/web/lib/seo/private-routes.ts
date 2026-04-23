/**
 * Pfade, die nicht indexiert werden sollen (eingeloggte App, interne Tools).
 * robots.txt — kein Ersatz für Auth; reduziert Crawl-Rauschen.
 */
export const ROBOTS_DISALLOW_PATHS: string[] = [
  '/dashboard',
  '/setup-workspace',
  '/onboarding',
  '/analytics',
  '/tasks',
  '/projects',
  '/team',
  '/customers',
  '/invoices',
  '/calendar',
  '/notifications',
  '/settings',
  '/help',
  '/flow',
  '/content-operations',
  '/operations-os',
  '/command-feed',
  '/deals',
  '/finance',
  '/purchasing',
  '/security',
];
