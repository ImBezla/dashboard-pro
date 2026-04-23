import { NextResponse } from 'next/server';
import { getSiteUrl, SITE_DESCRIPTION_DE, SITE_NAME } from '@/lib/site-url';
import {
  LANDING_FAQS,
  LANDING_LONG_SUMMARY_DE,
  LANDING_USE_CASES,
} from '@/lib/landing/marketing-copy';

/**
 * Konvention llmstxt.org — reiner Text für LLM-/Such-Crawler (ohne App-Login).
 * @see https://llmstxt.org/
 */
export function GET() {
  const base = getSiteUrl().replace(/\/$/, '');
  const lines: string[] = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION_DE}`,
    '',
    LANDING_LONG_SUMMARY_DE,
    '',
    '## Einsatzbereiche',
    ...LANDING_USE_CASES.map((u) => `- **${u.k}** (${u.t}): ${u.d}`),
    '',
    '## Häufige Fragen',
    ...LANDING_FAQS.flatMap((f) => [`### ${f.q}`, f.a, '']),
    '## Newsletter',
    'Auf der Startseite: Anmeldung per E-Mail; die API sendet eine Bestätigungsmail (Double-Opt-in). Endpunkte: POST /newsletter/subscribe, POST /newsletter/confirm. Bestätigungsseite: /verify-newsletter?token=…',
    '',
    '## Wichtige URLs',
    `- Start: ${base}/`,
    `- Registrierung: ${base}/register`,
    `- Anmeldung: ${base}/login`,
    `- Impressum: ${base}/impressum`,
    `- Datenschutz: ${base}/datenschutz`,
    `- AGB: ${base}/agb`,
    `- llms.txt: ${base}/llms.txt`,
    `- Sitemap: ${base}/sitemap.xml`,
    '',
  ];

  return new NextResponse(lines.join('\n').trimEnd() + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
