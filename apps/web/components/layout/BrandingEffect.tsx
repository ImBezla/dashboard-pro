'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

const DEFAULT_PRIMARY = '#6366f1';
const DEFAULT_PRIMARY_DARK = '#4f46e5';

/** Setzt CSS-Variablen und Dokumenttitel aus Organisations-Branding (White-Label). */
export function BrandingEffect() {
  const org = useAuthStore((s) => s.user?.organization);

  useEffect(() => {
    const root = document.documentElement;
    const b = org?.branding;
    const titleBase = b?.displayName ?? org?.name ?? 'Dashboard';

    document.title = titleBase;

    const accent = b?.primaryColor ?? DEFAULT_PRIMARY;
    if (b?.primaryColor) {
      root.style.setProperty('--primary', b.primaryColor);
      root.style.setProperty(
        '--primary-dark',
        b.primaryDark ?? b.primaryColor,
      );
    } else {
      root.style.setProperty('--primary', DEFAULT_PRIMARY);
      root.style.setProperty('--primary-dark', DEFAULT_PRIMARY_DARK);
    }

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', accent);
  }, [org?.branding, org?.name]);

  return null;
}
