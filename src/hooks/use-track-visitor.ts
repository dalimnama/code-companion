import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useTrackVisitor() {
  useEffect(() => {
    // Only track once per session
    let tracked = false;
    try {
      tracked = window.sessionStorage.getItem('visitor_tracked') === '1';
    } catch {
      // sessionStorage can be blocked in strict iPhone privacy modes
    }
    if (tracked) return;

    const url = new URL(window.location.href);
    const utmSource = url.searchParams.get('utm_source') || '';
    const referrer = document.referrer || '';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const doTrack = () => {
      fetch(`${supabaseUrl}/functions/v1/track-visitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrer,
          utm_source: utmSource || (url.searchParams.get('fbclid') ? 'facebook' : ''),
          page_url: window.location.pathname,
        }),
        keepalive: true,
      }).catch(() => {});
    };

    // Defer tracking to not block main thread
    const ric = (window as any).requestIdleCallback;
    if (ric) { ric(doTrack); } else { setTimeout(doTrack, 2000); }

    try {
      window.sessionStorage.setItem('visitor_tracked', '1');
    } catch {
      // Ignore storage write errors
    }
  }, []);
}
