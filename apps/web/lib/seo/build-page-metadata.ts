import type { Metadata } from 'next';
import { getSiteUrl, SITE_NAME } from '@/lib/site-url';

const OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
} as const;

function canonicalUrl(path: string): string {
  const base = getSiteUrl().replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p === '/') return base;
  return `${base}${p.replace(/\/$/, '')}`;
}

/**
 * Standard-SEO für öffentliche Seiten (OG/Twitter, Canonical, Keywords).
 */
export function buildPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noindex?: boolean;
}): Metadata {
  const url = canonicalUrl(input.path);
  const ogTitle = `${input.title} | ${SITE_NAME}`;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'de_DE',
      alternateLocale: ['en_US'],
      url,
      siteName: SITE_NAME,
      title: ogTitle,
      description: input.description,
      images: [{ ...OG_IMAGE, alt: ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: input.description,
      images: ['/twitter-image'],
    },
    robots: input.noindex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };
}

/** Startseite: fester Seitentitel ohne Template-Suffix; OG nutzt Kurzmarke. */
export function buildHomeMetadata(input: {
  titleAbsolute: string;
  description: string;
  keywords?: string[];
}): Metadata {
  const base = getSiteUrl().replace(/\/$/, '');
  return {
    title: { absolute: input.titleAbsolute },
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: base },
    openGraph: {
      type: 'website',
      locale: 'de_DE',
      alternateLocale: ['en_US'],
      url: base,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: input.description,
      images: [{ ...OG_IMAGE, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description: input.description,
      images: ['/twitter-image'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
