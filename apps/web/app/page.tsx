import type { Metadata } from 'next';
import { HomeLanding } from '@/components/landing/HomeLanding';
import { buildHomeMetadata } from '@/lib/seo/build-page-metadata';
import { HomeJsonLd } from '@/components/seo/HomeJsonLd';

export const metadata: Metadata = buildHomeMetadata({
  titleAbsolute: 'Dashboard Pro — Aufgaben, Projekte, Team',
  description:
    'Workspace für Aufgaben, Projekte und Zusammenarbeit. Registrieren, Workspace anlegen, Team per Code einladen.',
  keywords: [
    'Aufgabenmanagement',
    'Projektmanagement',
    'Team',
    'Workspace',
    'Organisation',
    'Mandant',
    'Operations',
    'Dashboard Pro',
  ],
});

export default function Home() {
  return (
    <>
      <HomeJsonLd />
      <HomeLanding />
    </>
  );
}
