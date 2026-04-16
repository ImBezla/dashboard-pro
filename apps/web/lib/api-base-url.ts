/**
 * API-Basis-URL für direkte fetch() Calls in Client-Komponenten.
 *
 * Erlaubt absolute URLs (https://api.example.com) oder relative Pfade (z. B. /api),
 * wenn die API hinter demselben Origin via Reverse-Proxy hängt.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

