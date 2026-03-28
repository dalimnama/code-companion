import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    const prev = prevPathname.current;
    prevPathname.current = pathname;

    // Don't scroll to top when returning to admin settings hub from a sub-page
    const isBackToSettingsHub = pathname === '/admin/settings' && prev.startsWith('/admin/settings/');
    if (!isBackToSettingsHub) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
