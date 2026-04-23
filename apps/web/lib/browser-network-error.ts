/**
 * Browser formulieren Netzwerk-/CORS-/TLS-Fehler bei fetch() unterschiedlich.
 * Safari meldet z. B. "Load failed" statt "Failed to fetch".
 */
export function isBrowserNetworkErrorMessage(message: string): boolean {
  const m = message.trim().toLowerCase();
  if (!m) return false;
  return (
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('load failed') ||
    m.includes('network request failed') ||
    m.includes('the internet connection appears to be offline') ||
    m.includes('load could not be completed')
  );
}

export function apiUnreachableUserMessage(apiUrl: string): string {
  const u = apiUrl.toLowerCase();
  const isLocalDev =
    u.includes('localhost') ||
    u.includes('127.0.0.1') ||
    u.includes('[::1]');
  if (isLocalDev) {
    return `API nicht erreichbar (${apiUrl}). Lokal im Projektroot: npm run dev — oder nur API: npm run dev:api (Port 3002). In apps/web/.env.local: NEXT_PUBLIC_API_URL.`;
  }
  return `API nicht erreichbar (${apiUrl}). URL/Zertifikat, laufender Dienst und CORS prüfen; bei Deploy NEXT_PUBLIC_API_URL im Web-Build setzen.`;
}
