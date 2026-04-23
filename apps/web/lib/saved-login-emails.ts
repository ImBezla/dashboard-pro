const STORAGE_KEY = 'dashboardpro.savedLoginEmails';
const MAX = 10;

export function normalizeLoginEmail(email: string): string {
  return email.trim().toLowerCase().normalize('NFKC');
}

function normalizeForStorage(email: string): string {
  return normalizeLoginEmail(email);
}

/** Zuletzt erfolgreich genutzte E-Mails (lokal, nur dieses Gerät). */
export function loadSavedLoginEmails(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === 'string' && x.includes('@'))
      .map((x) => normalizeForStorage(x))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Nach erfolgreichem Login oder nach Registrierung merken. */
export function rememberLoginEmail(email: string): void {
  if (typeof window === 'undefined') return;
  const norm = normalizeForStorage(email);
  if (!norm || !norm.includes('@')) return;
  const prev = loadSavedLoginEmails().filter((e) => e !== norm);
  const next = [norm, ...prev].slice(0, MAX);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
