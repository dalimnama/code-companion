// Lightweight server-side event tracker
// Fires & forgets — never blocks UI

import { supabase } from '@/integrations/supabase/client';

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  try {
    sessionId = sessionStorage.getItem('event_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('event_session_id', sessionId);
    }
  } catch {
    sessionId = crypto.randomUUID();
  }
  return sessionId;
}

interface TrackEventParams {
  event_type: string;
  product_id?: string;
  product_title?: string;
  product_price?: number;
  product_size?: string;
  quantity?: number;
  customer_phone?: string;
  customer_name?: string;
  metadata?: Record<string, any>;
}

export async function trackEvent(params: TrackEventParams) {
  try {
    // Auto-fill customer info from logged-in session if not provided
    if (!params.customer_name && !params.customer_phone) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const meta = session.user.user_metadata;
          params.customer_name = meta?.full_name || '';
          params.customer_phone = meta?.phone || '';
        }
      } catch {
        // Silent — proceed without user info
      }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    fetch(`${supabaseUrl}/functions/v1/track-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        session_id: getSessionId(),
      }),
    }).catch(() => {});
  } catch {
    // Silent fail
  }
}
