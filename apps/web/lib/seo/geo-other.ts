import { SITE_NAME } from '@/lib/site-url';

/**
 * GEO-/ICBM-Meta für `metadata.other` (Konsistenz auf allen öffentlichen Seiten).
 * Werte aus NEXT_PUBLIC_GEO_* — siehe apps/web/.env.example.
 */
export function getGeoOtherMetadata(): Record<string, string> {
  const region = process.env.NEXT_PUBLIC_GEO_REGION?.trim() || 'DE';
  const placename = process.env.NEXT_PUBLIC_GEO_PLACENAME?.trim();
  const position = process.env.NEXT_PUBLIC_GEO_POSITION?.trim();
  return {
    'geo.region': region,
    ...(placename ? { 'geo.placename': placename } : {}),
    ...(position ? { 'geo.position': position, ICBM: position } : {}),
  };
}

/** Vollständiges `metadata.other` für Layout + öffentliche Seiten (Next ersetzt `other` beim Merge). */
export function getDefaultOtherMetadata(): Record<string, string> {
  const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID?.trim();
  return {
    ...getGeoOtherMetadata(),
    ...(facebookAppId ? { 'fb:app_id': facebookAppId } : {}),
    'apple-mobile-web-app-title': SITE_NAME,
    'mobile-web-app-capable': 'yes',
  };
}
