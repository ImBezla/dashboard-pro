/**
 * JWT im Cookie kann „=“ u. a. enthalten — ohne Kodierung bricht `document.cookie` ab.
 * Middleware muss symmetrisch dekodieren.
 */
export const AUTH_TOKEN_COOKIE_NAME = 'token';

/** In Produktion bzw. bei https-Site: `Secure`, damit das Token nicht über HTTP-Lecks mitgeht. */
export function shouldUseSecureAuthCookie(): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  const u = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return Boolean(u?.startsWith('https://'));
}

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
  const secure = shouldUseSecureAuthCookie() ? '; Secure' : '';
  return `${AUTH_TOKEN_COOKIE_NAME}=${encodeAuthCookieTokenValue(token)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function buildClearAuthTokenCookieHeader(): string {
  const secure = shouldUseSecureAuthCookie() ? '; Secure' : '';
  return `${AUTH_TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${secure}`;
}
