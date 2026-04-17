'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { LocaleProvider, PREFERENCES_CHANGED_EVENT } from '@/lib/i18n/context';
import {
  applyDocumentTheme,
  readStoredDocumentTheme,
} from '@/lib/theme-document';

function DocumentThemeSync() {
  useEffect(() => {
    const sync = () => applyDocumentTheme(readStoredDocumentTheme());
    sync();
    window.addEventListener(PREFERENCES_CHANGED_EVENT, sync);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onOsTheme = () => {
      if (readStoredDocumentTheme() === 'auto') {
        applyDocumentTheme('auto');
      }
    };
    mq.addEventListener('change', onOsTheme);
    return () => {
      window.removeEventListener(PREFERENCES_CHANGED_EVENT, sync);
      mq.removeEventListener('change', onOsTheme);
    };
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <DocumentThemeSync />
        {children}
      </LocaleProvider>
    </QueryClientProvider>
  );
}

