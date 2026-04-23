import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Neues Passwort setzen',
  description:
    'Neues Passwort für Ihr Dashboard-Pro-Konto festlegen.',
  path: '/reset-password',
  keywords: ['Passwort', 'Reset', 'Dashboard Pro'],
  noindex: true,
});

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
