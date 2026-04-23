/**
 * Plattform-Inhaber / Betrieb: globaler User.role === ADMIN oder E-Mail in PLATFORM_ADMIN_EMAILS.
 * Liste: Komma- oder Leerzeichen-getrennt, wie Auth-E-Mails normalisiert (trim, lower, NFKC).
 */
export function normalizePlatformAdminEmail(email: string): string {
  return email.trim().toLowerCase().normalize('NFKC');
}

export function parsePlatformAdminEmailAllowlist(): Set<string> {
  const raw = process.env.PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) return new Set();
  const set = new Set<string>();
  for (const part of raw.split(/[\s,]+/)) {
    const n = normalizePlatformAdminEmail(part);
    if (n) set.add(n);
  }
  return set;
}

export function isPlatformAdminUser(
  email: string | undefined,
  globalRole: string | undefined,
): boolean {
  if (globalRole === 'ADMIN') return true;
  if (!email?.trim()) return false;
  return parsePlatformAdminEmailAllowlist().has(
    normalizePlatformAdminEmail(email),
  );
}
