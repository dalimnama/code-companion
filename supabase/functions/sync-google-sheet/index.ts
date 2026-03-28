import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookUrl = Deno.env.get('GOOGLE_SHEET_WEBHOOK_URL');
    if (!webhookUrl) {
      throw new Error('GOOGLE_SHEET_WEBHOOK_URL is not configured');
    }

    const order = await req.json();
    const items = order.items || [];
    const siteUrl = 'https://rikapio.lovable.app';

    // Create one row per product item
    const rows = items.map((item: any) => ({
      order_id: order.order_id,
      customer_name: order.customer_name,
      mobile: order.customer_phone,
      email: order.customer_email,
      address: `${order.address}, ${order.area}, ${order.city}`,
      product_name: item.title,
      product_link: `${siteUrl}/p/${item.slug}`,
      quantity: item.quantity,
      unit_price: item.price,
      total: order.total,
      status: 'Pending',
      order_date: new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' }),
      payment_method: order.payment_method,
      transaction_id: order.transaction_id || 'N/A',
      shipping_cost: order.shipping_cost,
      discount: order.discount_amount,
    }));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });

    console.log('Google Sheet response status:', response.status);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Google Sheet sync error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
