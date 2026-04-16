import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { RootJsonLd } from '@/components/seo/RootJsonLd';
import {
  getSiteUrl,
  PUBLISHER_NAME,
  SITE_DESCRIPTION_DE,
  SITE_NAME,
} from '@/lib/site-url';

const siteUrl = getSiteUrl();

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();
const yandexVerification = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION?.trim();
const geoRegion = process.env.NEXT_PUBLIC_GEO_REGION?.trim() || 'DE';
const geoPlacename = process.env.NEXT_PUBLIC_GEO_PLACENAME?.trim();
const geoPosition = process.env.NEXT_PUBLIC_GEO_POSITION?.trim();
const twitterSite = process.env.NEXT_PUBLIC_TWITTER_SITE?.trim();
const twitterCreator = process.env.NEXT_PUBLIC_TWITTER_CREATOR?.trim();

const verificationBlock: Metadata['verification'] = {
  ...(googleVerification ? { google: googleVerification } : {}),
  ...(yandexVerification ? { yandex: yandexVerification } : {}),
  ...(bingVerification
    ? { other: { 'msvalidate.01': bingVerification } }
    : {}),
};
const hasVerification =
  Boolean(googleVerification || yandexVerification || bingVerification);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION_DE,
  applicationName: SITE_NAME,
  authors: [{ name: PUBLISHER_NAME, url: siteUrl }],
  creator: PUBLISHER_NAME,
  publisher: PUBLISHER_NAME,
  manifest: '/manifest.json',
  /** SVG + dynamische PNG-Icons (`app/icon.tsx`, `app/apple-icon.tsx`). */
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icon', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: '/favicon.svg',
    apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  referrer: 'strict-origin-when-cross-origin',
  keywords: [
    'Dashboard Pro',
    'Projektmanagement',
    'Aufgaben',
    'Team',
    'Workspace',
    'Finanzen',
    'Operations',
    'B2B',
    'SaaS',
  ],
  category: 'business',
  classification: 'Business software',
  ...(hasVerification ? { verification: verificationBlock } : {}),
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    alternateLocale: ['en_US'],
    url: siteUrl,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION_DE,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    ...(twitterSite ? { site: twitterSite } : {}),
    ...(twitterCreator ? { creator: twitterCreator } : {}),
    title: SITE_NAME,
    description: SITE_DESCRIPTION_DE,
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
  alternates: {
    languages: {
      de: siteUrl,
      'x-default': siteUrl,
    },
  },
  other: {
    'geo.region': geoRegion,
    ...(geoPlacename ? { 'geo.placename': geoPlacename } : {}),
    ...(geoPosition ? { 'geo.position': geoPosition, ICBM: geoPosition } : {}),
    'apple-mobile-web-app-title': SITE_NAME,
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)', color: '#312e81' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-dvh bg-light text-text antialiased">
        <RootJsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
