/** Einfache `className`-Zusammenführung (kein tailwind-merge, damit keine Reihenfolge-Fallen). */
export function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}
