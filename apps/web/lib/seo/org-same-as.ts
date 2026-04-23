/** Kommagetrennte Profil-URLs (LinkedIn, X, …) für JSON-LD `sameAs`. */
export function parseOrgSameAsFromEnv(): string[] {
  const raw = process.env.NEXT_PUBLIC_ORG_SAME_AS?.trim();
  if (!raw) return [];
  const out: string[] = [];
  for (const part of raw.split(/[,;\n]/)) {
    const s = part.trim();
    if (!s) continue;
    const candidate = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    try {
      const u = new URL(candidate);
      if (u.protocol === 'http:' || u.protocol === 'https:') out.push(u.href);
    } catch {
      /* ignorieren */
    }
  }
  return out;
}
