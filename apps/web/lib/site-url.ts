/** Öffentliche Basis-URL der Web-App (OG, Sitemap, JSON-LD, metadataBase). */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  return 'http://localhost:8000';
}

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

/**
 * Anzeige im Footer (Copyright-Zeile): bei lokaler Dev-URL kein „localhost“,
 * sondern bewusster Produkt-/Domain-Text — überschreibbar via NEXT_PUBLIC_FOOTER_SITE_LABEL.
 */
export function getFooterDisplayHost(): string {
  const override = process.env.NEXT_PUBLIC_FOOTER_SITE_LABEL?.trim();
  if (override) {
    try {
      const u = override.includes('://') ? override : `https://${override}`;
      return new URL(u).hostname;
    } catch {
      return override.replace(/^https?:\/\//, '').split('/')[0] ?? override;
    }
  }
  try {
    const host = new URL(getSiteUrl()).hostname;
    if (LOCAL_HOSTNAMES.has(host) || host.endsWith('.local')) {
      return 'dashboardpro.de';
    }
    return host;
  } catch {
    return 'dashboardpro.de';
  }
}

export const SITE_NAME = 'Dashboard Pro';
export const SITE_DESCRIPTION_DE =
  'Arbeitsplattform für Projekt-, Team- und Aufgabenmanagement — Übersichten, Finanzen, Operations und mehr in einer App.';
export const SITE_DESCRIPTION_EN =
  'Workspace for project, team, and task management — dashboards, finance, operations, and more in one app.';

/** Rechtlicher Anbieter / Publisher (SEO, JSON-LD) — siehe Impressum. */
export const PUBLISHER_NAME = 'Northgate Corporate GmbH';
export const PUBLISHER_STREET = 'Salvatorstraße 11';
export const PUBLISHER_POSTAL_CODE = '85290';
export const PUBLISHER_ADDRESS_LOCALITY = 'Geisenfeld';
export const PUBLISHER_ADDRESS_COUNTRY = 'DE';

/** Öffentliche Support-Adresse (Hilfe, technische Fragen zu Dashboard Pro). */
export const SUPPORT_EMAIL = 'help@dashboardpro.de';
