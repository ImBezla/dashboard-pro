import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Newsletter bestätigen',
  description:
    'Newsletter-Anmeldung für Dashboard Pro abschließen — Double-Opt-in.',
  path: '/verify-newsletter',
  keywords: ['Newsletter', 'Bestätigung', 'Dashboard Pro'],
  noindex: true,
});

export default function VerifyNewsletterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
