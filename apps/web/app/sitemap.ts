import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[0]['changeFrequency']>;

/** Öffentliche Einstiegs-URLs (ohne eingeloggte App-Bereiche). */
const PUBLIC_PATHS: { path: string; changeFrequency: ChangeFreq; priority: number }[] =
  [
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/login', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/register', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/forgot-password', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/reset-password', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/verify-email', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/impressum', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/datenschutz', changeFrequency: 'yearly', priority: 0.35 },
    { path: '/agb', changeFrequency: 'yearly', priority: 0.35 },
    { path: '/llms.txt', changeFrequency: 'monthly', priority: 0.25 },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().replace(/\/$/, '');
  const now = new Date();
  return PUBLIC_PATHS.map(({ path, changeFrequency, priority }) => {
    const url = `${base}${path}`;
    return {
      url,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          de: url,
          'x-default': url,
        },
      },
    };
  });
}
