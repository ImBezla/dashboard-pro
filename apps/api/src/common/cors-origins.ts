/** Normalisierte Origin-URL ohne trailing slash. */
export function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/$/, '');
}

/** Apex ↔ www, damit CORS/WebSocket nicht an Host-Variante scheitern. */
function expandPublicSiteOrigins(base: string | undefined): string[] {
  const out = new Set<string>();
  if (!base?.trim()) return [];
  const primary = normalizeOrigin(base);
  out.add(primary);
  try {
    const u = new URL(primary);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return [...out];
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
      return [...out];
    }
    const port = u.port ? `:${u.port}` : '';
    if (host.startsWith('www.')) {
      out.add(`${u.protocol}//${host.slice(4)}${port}`);
    } else {
      out.add(`${u.protocol}//www.${host}${port}`);
    }
  } catch {
    /* ignore */
  }
  return [...out];
}

function additionalCorsFromEnv(): string[] {
  const raw = process.env.ADDITIONAL_CORS_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((s) => normalizeOrigin(s))
    .filter(Boolean);
}

const LOCAL_DEV_ORIGINS = [
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://[::1]:8000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
] as const;

/**
 * Erlaubte Browser-Origins (HTTP-CORS, Socket.IO).
 * In Produktion nur konfigurierte öffentliche URLs — kein localhost-Fallback.
 */
export function getCorsOriginList(isProduction: boolean): string[] {
  const set = new Set<string>([
    ...expandPublicSiteOrigins(
      process.env.FRONTEND_URL || 'http://localhost:8000',
    ),
    ...expandPublicSiteOrigins(process.env.NEXT_PUBLIC_SITE_URL),
    ...additionalCorsFromEnv(),
  ]);
  if (!isProduction) {
    for (const o of LOCAL_DEV_ORIGINS) {
      set.add(o);
    }
  }
  return [...set];
}
