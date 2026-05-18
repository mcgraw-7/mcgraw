import App from 'next/app';
import type { AppProps, AppContext } from 'next/app';
import Nav from '../app/components/nav';
import HotkeyHelp from '../app/components/HotkeyHelp';
import { Analytics } from "@vercel/analytics/react";
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import Font Awesome CSS
import '../public/fonts/fontawesome-pro/css/all.min.css'; // Import Font Awesome Pro CSS
import '../app/globals.css';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';

// Page order for cycling
const PAGES = ['/', '/work', '/more'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isHomePage = router.pathname === '/';
  const isChristmasApp = router.pathname.startsWith('/christmas-adventure');
  const isAutomatePage = router.pathname === '/automate';
  const isHowItWorksPage = router.pathname === '/how-it-works';
  const [showHelp, setShowHelp] = useState(false);

  // Global hotkey handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    // Don't trigger hotkeys when typing in input fields
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // ? or ⌘/Ctrl + / : Toggle help overlay
    if (e.key === '?' || (modifier && e.key === '/')) {
      e.preventDefault();
      setShowHelp(prev => !prev);
      return;
    }

    // Escape : Close help overlay
    if (e.key === 'Escape' && showHelp) {
      e.preventDefault();
      setShowHelp(false);
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
  }, [router, showHelp]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div>
      {!isHomePage && !isChristmasApp && !isAutomatePage && !isHowItWorksPage && <Nav />}
      <Component {...pageProps} />
      <HotkeyHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <Analytics />
    </div>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps };
};

export default MyApp;
