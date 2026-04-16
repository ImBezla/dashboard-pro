'use client';

import { useEffect, useState } from 'react';

/** Entspricht Tailwind `darkMode: 'class'` auf `document.documentElement`. */
export function useDocumentDark(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.classList.contains('dark'));
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  return dark;
}
