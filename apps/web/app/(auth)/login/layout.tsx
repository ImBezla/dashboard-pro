import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Anmelden',
  description:
    'Melden Sie sich bei Dashboard Pro an — sicherer Zugang zu Ihrem Workspace, Aufgaben und Projekten.',
  path: '/login',
  keywords: ['Login', 'Anmeldung', 'Dashboard Pro', 'Workspace'],
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
