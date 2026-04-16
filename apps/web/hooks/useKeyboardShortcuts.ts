'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if user is typing in an input field
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Only allow Escape in input fields
      if (event.key !== 'Escape') return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    // ⌘/Ctrl + K: Focus search
    if (modifier && event.key === 'k') {
      event.preventDefault();
      const searchInput = document.querySelector('input[placeholder="Suchen..."]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }

    // ⌘/Ctrl + D: Dashboard
    if (modifier && event.key === 'd') {
      event.preventDefault();
      router.push('/dashboard');
    }

    // ⌘/Ctrl + P: Projects
    if (modifier && event.key === 'p') {
      event.preventDefault();
      router.push('/projects');
    }

    // ⌘/Ctrl + T: Tasks
    if (modifier && event.key === 't') {
      event.preventDefault();
      router.push('/tasks');
    }

    // ⌘/Ctrl + C: Calendar (only if not copying)
    if (modifier && event.key === 'c' && !event.shiftKey) {
      // Don't intercept copy, only if nothing is selected
      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) {
        event.preventDefault();
        router.push('/calendar');
      }
    }

    // ⌘/Ctrl + ,: Settings
    if (modifier && event.key === ',') {
      event.preventDefault();
      router.push('/settings');
    }

    // ⌘/Ctrl + /: Help
    if (modifier && event.key === '/') {
      event.preventDefault();
      router.push('/help');
    }

    // Escape: Close modals, clear search
    if (event.key === 'Escape') {
      // Clear search if focused
      const searchInput = document.querySelector('input[placeholder="Suchen..."]') as HTMLInputElement;
      if (document.activeElement === searchInput) {
        searchInput.blur();
        searchInput.value = '';
        // Trigger input event to clear results
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }, [router]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
