import {
  getSiteUrl,
  PUBLISHER_ADDRESS_COUNTRY,
  PUBLISHER_ADDRESS_LOCALITY,
  PUBLISHER_NAME,
  PUBLISHER_POSTAL_CODE,
  PUBLISHER_STREET,
  SITE_DESCRIPTION_DE,
  SITE_NAME,
  SUPPORT_EMAIL,
} from '@/lib/site-url';
import { parseOrgSameAsFromEnv } from '@/lib/seo/org-same-as';

export function RootJsonLd() {
  const url = getSiteUrl();
  const publisherId = `${url}/#publisher`;
  const websiteId = `${url}/#website`;
  const logoUrl = `${url.replace(/\/$/, '')}/brand/logo-wordmark.svg`;
  const sameAs = parseOrgSameAsFromEnv();

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: SITE_NAME,
        url,
        description: SITE_DESCRIPTION_DE,
        inLanguage: ['de-DE', 'en-US'],
        publisher: { '@id': publisherId },
      },
      {
        '@type': 'Organization',
        '@id': publisherId,
        name: PUBLISHER_NAME,
        legalName: PUBLISHER_NAME,
        email: SUPPORT_EMAIL,
        url,
        logo: logoUrl,
        ...(sameAs.length ? { sameAs } : {}),
        address: {
          '@type': 'PostalAddress',
          streetAddress: PUBLISHER_STREET,
          addressLocality: PUBLISHER_ADDRESS_LOCALITY,
          postalCode: PUBLISHER_POSTAL_CODE,
          addressCountry: PUBLISHER_ADDRESS_COUNTRY,
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url,
        image: `${url.replace(/\/$/, '')}/opengraph-image`,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
        },
        description: SITE_DESCRIPTION_DE,
        provider: { '@id': publisherId },
        publisher: { '@id': publisherId },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
