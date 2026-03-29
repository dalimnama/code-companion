import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const scrollPositions = new Map<string, number>();

export function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  // Save scroll position before navigating away
  useEffect(() => {
    const save = () => {
      scrollPositions.set(pathname, window.scrollY);
    };
    window.addEventListener('beforeunload', save);
    return () => {
      window.removeEventListener('beforeunload', save);
      // Save current scroll when leaving this route
      scrollPositions.set(pathname, window.scrollY);
    };
  }, [pathname]);

  useEffect(() => {
    const prev = prevPathname.current;
    prevPathname.current = pathname;

    // Admin panel: restore scroll position when going back (deeper → shallower)
    const isAdmin = pathname.startsWith('/admin');
    const prevIsAdmin = prev.startsWith('/admin');

    if (isAdmin && prevIsAdmin) {
      // Going back from a deeper admin page (e.g. /admin/settings/color → /admin/settings)
      const isGoingBack = prev.startsWith(pathname) && prev !== pathname;
      // Or navigating between sibling admin pages at same level
      const isSettingsHub = pathname === '/admin/settings' && prev.startsWith('/admin/settings/');

      if (isGoingBack || isSettingsHub) {
        const saved = scrollPositions.get(pathname);
        if (saved !== undefined) {
          requestAnimationFrame(() => {
            window.scrollTo(0, saved);
          });
          return;
        }
        // Don't scroll to top even if no saved position
        return;
      }
    }

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
