export function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtRel(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `vor ${h} Std`;
  return `vor ${Math.floor(h / 24)} Tg`;
}
