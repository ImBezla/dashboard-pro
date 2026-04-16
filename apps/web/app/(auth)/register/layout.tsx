import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Registrieren',
  description:
    'Konto für Dashboard Pro erstellen — Team- und Projektworkspace in wenigen Minuten.',
  path: '/register',
  keywords: ['Registrierung', 'Konto', 'Dashboard Pro', 'Workspace'],
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
