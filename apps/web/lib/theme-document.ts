/** Gleicher Key wie in den Einstellungen / LocaleProvider. */
export const DASHBOARD_PREFERENCES_KEY = 'dashboardpro_preferences';

export type DocumentTheme = 'light' | 'dark' | 'auto';

export function readStoredDocumentTheme(): DocumentTheme {
  if (typeof window === 'undefined') return 'light';
  try {
    const raw = localStorage.getItem(DASHBOARD_PREFERENCES_KEY);
    if (!raw) return 'light';
    const parsed = JSON.parse(raw) as { theme?: string };
    if (
      parsed.theme === 'dark' ||
      parsed.theme === 'light' ||
      parsed.theme === 'auto'
    ) {
      return parsed.theme;
    }
  } catch {
    /* ignore */
  }
  return 'light';
}

/** Tailwind `darkMode: 'class'` — Klasse `dark` auf `<html>`. */
export function applyDocumentTheme(theme: DocumentTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}
