import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';
import { ROBOTS_DISALLOW_PATHS } from '@/lib/seo/private-routes';

/**
 * Crawling: `allow: '/'` umfasst auch `/llms.txt` (Plaintext für KI-/Such-Crawler).
 * `/llms.txt` ist zusätzlich in `sitemap.xml` verlinkt.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', ...ROBOTS_DISALLOW_PATHS],
      },
    ],
    host: base,
    sitemap: `${base}/sitemap.xml`,
  };
}
