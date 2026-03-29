import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const scrollPositions = new Map<string, number>();

export function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const prevPathname = useRef(pathname);

  const normalizePath = (path: string) => {
    if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
    return path;
  };

  const restoreWithRetry = (targetY: number, tries = 0) => {
    window.scrollTo(0, targetY);
    if (Math.abs(window.scrollY - targetY) <= 2 || tries >= 12) return;
    requestAnimationFrame(() => restoreWithRetry(targetY, tries + 1));
  };

  // Keep scroll position up-to-date while user scrolls
  useEffect(() => {
    const saveCurrent = () => {
      scrollPositions.set(pathname, window.scrollY);
    };

    window.addEventListener('scroll', saveCurrent, { passive: true });

    const save = () => {
      scrollPositions.set(pathname, window.scrollY);
    };

    window.addEventListener('beforeunload', save);

    return () => {
      window.removeEventListener('scroll', saveCurrent);
      window.removeEventListener('beforeunload', save);
      // Save current scroll when leaving this route
      scrollPositions.set(pathname, window.scrollY);
    };
  }, [pathname]);

  useEffect(() => {
    const prev = normalizePath(prevPathname.current);
    const current = normalizePath(pathname);
    prevPathname.current = current;

    // Admin panel: restore scroll position when going back (deeper → shallower)
    const isAdmin = current.startsWith('/admin');
    const prevIsAdmin = prev.startsWith('/admin');

    if (isAdmin && prevIsAdmin) {
      // Going back from a deeper admin page (e.g. /admin/settings/color → /admin/settings)
      const isGoingBack = prev.startsWith(`${current}/`) && prev !== current;
      // Or navigating between sibling admin pages at same level
      const isSettingsHub = current === '/admin/settings' && prev.startsWith('/admin/settings/');
      const isBrowserBack = navigationType === 'POP';
      const saved = scrollPositions.get(current);

      if ((isGoingBack || isSettingsHub || isBrowserBack) && saved !== undefined) {
        requestAnimationFrame(() => restoreWithRetry(saved));
        return;
      }

      if (isGoingBack || isSettingsHub || isBrowserBack) {
        // Don't force top on back-like admin navigation when no saved value exists
        return;
      }
    }

    window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
}
