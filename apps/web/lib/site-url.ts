/** Öffentliche Basis-URL der Web-App (OG, Sitemap, JSON-LD, metadataBase). */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  return 'http://localhost:8000';
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
