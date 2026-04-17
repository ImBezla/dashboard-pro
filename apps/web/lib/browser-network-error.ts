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
  return `Keine Verbindung zur API (${apiUrl}). Bitte prüfen: HTTPS-URL und Zertifikat der API, laufender API-Container, CORS (Website mit/ohne www muss zur FRONTEND_URL passen), danach Web-Image neu bauen (NEXT_PUBLIC_*).`;
}
