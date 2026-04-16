import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/build-page-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Workspace einrichten',
  description:
    'Organisation in Dashboard Pro anlegen oder per Code beitreten.',
  path: '/setup-workspace',
  keywords: ['Workspace', 'Organisation', 'Dashboard Pro'],
  noindex: true,
});

export default function SetupWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
