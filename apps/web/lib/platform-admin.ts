/**
 * Muss mit apps/api/src/common/platform-admin.util.ts übereinstimmen
 * (Middleware + UI, ohne gemeinsames Paket).
 */
export function normalizePlatformAdminEmail(email: string): string {
  return email.trim().toLowerCase().normalize('NFKC');
}

export function parsePlatformAdminEmailAllowlistFromString(
  raw: string | undefined,
): Set<string> {
  const trimmed = raw?.trim();
  if (!trimmed) return new Set();
  const set = new Set<string>();
  for (const part of trimmed.split(/[\s,]+/)) {
    const n = normalizePlatformAdminEmail(part);
    if (n) set.add(n);
  }
  return set;
}

export function isPlatformAdminFromJwtPayload(
  payload: Record<string, unknown>,
): boolean {
  if (payload.globalRole === 'ADMIN') return true;
  const email =
    typeof payload.email === 'string' ? payload.email : undefined;
  if (!email?.trim()) return false;
  const allow = parsePlatformAdminEmailAllowlistFromString(
    process.env.PLATFORM_ADMIN_EMAILS,
  );
  if (allow.size === 0) return false;
  return allow.has(normalizePlatformAdminEmail(email));
}

export function isPlatformAdminUser(user: {
  isPlatformAdmin?: boolean;
  role?: string;
} | null): boolean {
  if (!user) return false;
  if (user.isPlatformAdmin === true) return true;
  return user.role === 'ADMIN';
}
