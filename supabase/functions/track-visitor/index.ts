import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function detectSource(referrer: string, utmSource: string): string {
  if (utmSource) {
    const s = utmSource.toLowerCase();
    if (s.includes('facebook') || s.includes('fb')) return 'facebook';
    if (s.includes('instagram') || s.includes('ig')) return 'instagram';
    if (s.includes('tiktok')) return 'tiktok';
    if (s.includes('linkedin')) return 'linkedin';
    if (s.includes('google')) return 'google';
    if (s.includes('youtube') || s.includes('yt')) return 'youtube';
    if (s.includes('twitter') || s.includes('x.com')) return 'twitter';
    return s;
  }

  if (!referrer) return 'direct';

  const r = referrer.toLowerCase();
  if (r.includes('facebook.com') || r.includes('fb.com') || r.includes('fbclid')) return 'facebook';
  if (r.includes('instagram.com')) return 'instagram';
  if (r.includes('tiktok.com')) return 'tiktok';
  if (r.includes('linkedin.com')) return 'linkedin';
  if (r.includes('google.com') || r.includes('google.co')) return 'google';
  if (r.includes('youtube.com')) return 'youtube';
  if (r.includes('twitter.com') || r.includes('x.com')) return 'twitter';
  if (r.includes('bing.com')) return 'bing';
  
  return 'other';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referrer, utm_source, page_url } = await req.json();

    // Get IP from request headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('cf-connecting-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    const source = detectSource(referrer || '', utm_source || '');

    // Get geolocation from free API
    let country = null, division = null, district = null, city = null;
    
    if (ip && ip !== 'unknown') {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          country = geo.country || null;
          division = geo.regionName || null;
          city = geo.city || null;
          district = geo.city || null; // ip-api doesn't have district, use city
        }
      } catch (e) {
        console.error('Geo lookup failed:', e);
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('visitors').insert({
      source,
      referrer_url: referrer || null,
      page_url: page_url || null,
      country,
      division,
      district,
      city,
      ip_address: ip,
      user_agent: userAgent,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Track visitor error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
