import { getSiteUrl, SITE_DESCRIPTION_DE, SITE_NAME } from '@/lib/site-url';
import { LANDING_FAQS } from '@/lib/landing/marketing-copy';

export function HomeJsonLd() {
  const url = getSiteUrl();
  const pageId = `${url}/#home`;
  const websiteId = `${url}/#website`;
  const faqId = `${url}/#faq`;

  const faqPage = {
    '@type': 'FAQPage',
    '@id': faqId,
    url,
    inLanguage: 'de-DE',
    mainEntity: LANDING_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': pageId,
        url,
        name: SITE_NAME,
        description: SITE_DESCRIPTION_DE,
        isPartOf: { '@id': websiteId },
        about: { '@id': faqId },
        inLanguage: ['de-DE', 'en-US'],
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: `${url}/opengraph-image`,
        },
      },
      faqPage,
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

