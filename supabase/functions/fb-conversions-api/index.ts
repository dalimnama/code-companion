import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_name, event_data, event_source_url, user_agent } = await req.json();

    // Get pixel settings from DB
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: settings } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['facebook_pixel_id', 'facebook_access_token']);

    const settingsMap: Record<string, string> = {};
    settings?.forEach((s: any) => { settingsMap[s.key] = s.value; });

    const pixelId = settingsMap['facebook_pixel_id'];
    const accessToken = settingsMap['facebook_access_token'];

    if (!pixelId || !accessToken) {
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        reason: 'facebook_tracking_not_configured',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('cf-connecting-ip') || '';

    // Build event payload for Facebook Conversions API
    const eventTime = Math.floor(Date.now() / 1000);

    const eventPayload: any = {
      event_name,
      event_time: eventTime,
      action_source: 'website',
      event_source_url: event_source_url || '',
      user_data: {
        client_ip_address: clientIp,
        client_user_agent: user_agent || '',
      },
    };

    // Add custom data based on event type
    if (event_data) {
      const customData: any = {};

      if (event_data.content_ids) customData.content_ids = event_data.content_ids;
      if (event_data.content_name) customData.content_name = event_data.content_name;
      if (event_data.content_type) customData.content_type = event_data.content_type;
      if (event_data.value !== undefined) customData.value = event_data.value;
      if (event_data.currency) customData.currency = event_data.currency;
      if (event_data.contents) customData.contents = event_data.contents;
      if (event_data.num_items) customData.num_items = event_data.num_items;
      if (event_data.content_category) customData.content_category = event_data.content_category;

      if (Object.keys(customData).length > 0) {
        eventPayload.custom_data = customData;
      }

      // Add user email/phone if provided (hashing should ideally be done)
      if (event_data.email) eventPayload.user_data.em = [event_data.email];
      if (event_data.phone) eventPayload.user_data.ph = [event_data.phone];
    }

    // Send to Facebook Conversions API
    const fbResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [eventPayload],
        }),
      }
    );

    const fbResult = await fbResponse.json();
    console.log('FB CAPI response:', JSON.stringify(fbResult));

    return new Response(JSON.stringify({ success: true, fb_response: fbResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('FB CAPI error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
