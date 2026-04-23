import { getSiteUrl, SITE_NAME } from '@/lib/site-url';

export function HomeJsonLd() {
  const url = getSiteUrl();
  const pageId = `${url}/#home`;
  const websiteId = `${url}/#website`;

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': pageId,
        url,
        name: SITE_NAME,
        isPartOf: { '@id': websiteId },
        inLanguage: ['de-DE', 'en-US'],
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: `${url}/opengraph-image`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: SITE_NAME,
            item: url,
          },
        ],
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

