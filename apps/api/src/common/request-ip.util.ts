/** Client-IP für Audit-Logs (Proxy: X-Forwarded-For). */
export function getRequestIp(req: {
  ip?: string;
  socket?: { remoteAddress?: string };
  headers?: Record<string, string | string[] | undefined>;
}): string | undefined {
  const xff = req.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0]?.trim();
  }
  if (Array.isArray(xff) && xff[0]) {
    return String(xff[0]).split(',')[0]?.trim();
  }
  if (req.ip) return req.ip;
  const ra = req.socket?.remoteAddress;
  return typeof ra === 'string' ? ra : undefined;
}
