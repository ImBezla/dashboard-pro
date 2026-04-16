import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'E-Mail bestätigen',
  description:
    'E-Mail-Adresse für Dashboard Pro bestätigen — Abschluss der Registrierung.',
  path: '/verify-email',
  keywords: ['E-Mail', 'Bestätigung', 'Dashboard Pro'],
  noindex: true,
});

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
