import { useEffect, useRef } from 'react';
import { useSiteSettings } from './use-site-settings';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

let pixelLoaded = false;

function loadPixelScript(pixelId: string) {
  if (pixelLoaded) return;
  pixelLoaded = true;

  // Standard FB Pixel snippet
  const f = window;
  const b = document;
  if (f.fbq) return;
  const n: any = (f.fbq = function (...args: any[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
  });
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];

  const s = b.createElement('script');
  s.async = true;
  s.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const firstScript = b.getElementsByTagName('script')[0];
  firstScript?.parentNode?.insertBefore(s, firstScript);

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

export function useFacebookPixel() {
  const { data: settings } = useSiteSettings();
  const pixelId = settings?.facebook_pixel_id;

  useEffect(() => {
    if (pixelId) {
      loadPixelScript(pixelId);
    }
  }, [pixelId]);
}

// Helper to fire standard events
export function fbTrack(event: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params);
  }
}

// Server-side event via edge function
export async function fbServerEvent(
  eventName: string,
  eventData: Record<string, any> = {}
) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    fetch(`${supabaseUrl}/functions/v1/fb-conversions-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        event_data: eventData,
        event_source_url: window.location.href,
        user_agent: navigator.userAgent,
      }),
    }).catch(() => {});
  } catch {
    // Silent fail
  }
}
