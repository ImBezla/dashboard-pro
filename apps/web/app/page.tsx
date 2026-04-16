import type { Metadata } from 'next';
import { HomeLanding } from '@/components/landing/HomeLanding';
import { buildHomeMetadata } from '@/lib/seo/build-page-metadata';

export const metadata: Metadata = buildHomeMetadata({
  titleAbsolute: 'Dashboard Pro — Projekt-, Team- & Operations-Plattform',
  description:
    'Eine Oberfläche für Aufgaben, Projekte, Echtzeit-Updates, Organisationen und mehr. Jetzt kostenlos starten.',
});

export default function Home() {
  return <HomeLanding />;
}
