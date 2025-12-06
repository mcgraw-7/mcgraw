import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

// Page order for cycling
const PAGES = ['/', '/work', '/more'];

export interface HotkeyConfig {
  onToggleTerminal?: () => void;
  onToggleHelp?: () => void;
}

export function useHotkeys(config: HotkeyConfig = {}) {
  const router = useRouter();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    // Don't trigger hotkeys when typing in input fields
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // ⌘/Ctrl + ← → : Cycle through pages
    if (modifier && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const currentIndex = PAGES.indexOf(router.pathname);
      if (currentIndex === -1) return;

      let newIndex;
      if (e.key === 'ArrowRight') {
        newIndex = (currentIndex + 1) % PAGES.length;
      } else {
        newIndex = (currentIndex - 1 + PAGES.length) % PAGES.length;
      }
      router.push(PAGES[newIndex]);
      return;
    }

    // ⌘/Ctrl + 1/2/3 : Jump to specific page
    if (modifier && ['1', '2', '3'].includes(e.key)) {
      e.preventDefault();
      const pageIndex = parseInt(e.key) - 1;
      if (PAGES[pageIndex]) {
        router.push(PAGES[pageIndex]);
      }
      return;
    }

    // ⌘/Ctrl + H : Go home
    if (modifier && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      router.push('/');
      return;
    }

    // ⌘/Ctrl + K : Close/clear terminal (page-specific)
    if (modifier && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      config.onToggleTerminal?.();
      return;
    }

    // ⌘/Ctrl + T : Open terminal (page-specific)
    if (modifier && e.key.toLowerCase() === 't') {
      e.preventDefault();
      config.onToggleTerminal?.();
      return;
    }

    // ? or ⌘/Ctrl + / : Toggle help overlay
    if (e.key === '?' || (modifier && e.key === '/')) {
      e.preventDefault();
      config.onToggleHelp?.();
      return;
    }

    // Escape : Close help overlay or terminal
    if (e.key === 'Escape') {
      config.onToggleHelp?.();
      return;
    }
  }, [router, config]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Helper to get modifier key symbol based on platform
export function getModifierKey(): string {
  if (typeof navigator !== 'undefined') {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return isMac ? '⌘' : 'Ctrl';
  }
  return '⌘';
}
