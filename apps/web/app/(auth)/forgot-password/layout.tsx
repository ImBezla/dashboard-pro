import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Passwort vergessen',
  description:
    'Passwort für Dashboard Pro zurücksetzen — sicherer Link per E-Mail.',
  path: '/forgot-password',
  keywords: ['Passwort', 'Zurücksetzen', 'Dashboard Pro'],
});

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
