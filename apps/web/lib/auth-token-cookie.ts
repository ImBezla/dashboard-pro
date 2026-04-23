/**
 * JWT im Cookie kann „=“ u. a. enthalten — ohne Kodierung bricht `document.cookie` ab.
 * Middleware muss symmetrisch dekodieren.
 */
export const AUTH_TOKEN_COOKIE_NAME = 'token';

export function encodeAuthCookieTokenValue(token: string): string {
  return encodeURIComponent(token);
}

export function decodeAuthCookieTokenValue(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function buildAuthTokenCookieHeader(token: string): string {
  const maxAge = 60 * 60 * 24 * 7;
  return `${AUTH_TOKEN_COOKIE_NAME}=${encodeAuthCookieTokenValue(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function buildClearAuthTokenCookieHeader(): string {
  return `${AUTH_TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
}
