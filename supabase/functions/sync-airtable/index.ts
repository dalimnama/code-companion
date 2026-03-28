import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AIRTABLE_TOKEN = Deno.env.get('AIRTABLE_TOKEN');
    const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID');

    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
      throw new Error('Airtable credentials not configured');
    }

    const body = await req.json();

    // Handle status update action
    if (body.action === 'update_status') {
      const { order_id, status } = body;
      const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
      const headers = {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      };

      // Status mapping from app to Airtable
      const statusMap: Record<string, string> = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
      };

      // Find order record by Order ID
      const formula = encodeURIComponent(`{Order ID}="${order_id}"`);
      const searchUrl = `${baseUrl}/Orders?filterByFormula=${formula}`;
      const searchRes = await fetch(searchUrl, { method: 'GET', headers });
      
      if (!searchRes.ok) {
        const err = await searchRes.text();
        console.error('Airtable search error:', err);
        throw new Error('Failed to find order in Airtable');
      }

      const searchData = await searchRes.json();
      const record = searchData.records?.[0];

      if (!record) {
        return new Response(JSON.stringify({ success: false, error: 'Order not found in Airtable' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update status
      const updateRes = await fetch(`${baseUrl}/Orders/${record.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          fields: { 'Status': statusMap[status] || status },
        }),
      });

      if (!updateRes.ok) {
        const err = await updateRes.text();
        console.error('Airtable status update error:', err);
        throw new Error('Failed to update status in Airtable');
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Original create order flow
    const orderData = body;
    const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
    const headers = {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // 1. Create Customer → get record ID
    const customerFields: Record<string, string> = {
      'Name': orderData.customer_name || '',
      'Phone': orderData.customer_phone || '',
      'Email': orderData.customer_email || '',
      'Address': `${orderData.address || ''}, ${orderData.area || ''}, ${orderData.city || ''}`,
    };

    const customerRes = await fetch(`${baseUrl}/Customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ records: [{ fields: customerFields }] }),
    });
    
    let customerRecordId = '';
    if (customerRes.ok) {
      const customerData = await customerRes.json();
      customerRecordId = customerData.records?.[0]?.id || '';
    } else {
      const err = await customerRes.text();
      console.error('Airtable Customers error:', err);
    }

    // 2. Create Order (no Address field - doesn't exist in Airtable Orders table)
    const paymentLabel = orderData.payment_method === 'cod' ? 'COD' 
      : orderData.payment_method === 'bkash' ? 'bKash' : 'Nagad';

    const orderFields: Record<string, unknown> = {
      'Order ID': orderData.order_id || '',
      'Subtotal': orderData.subtotal || 0,
      'Shipping Cost': orderData.shipping_cost || 0,
      'Discount': orderData.discount_amount || 0,
      'Payment Method': paymentLabel,
      'Transaction ID': orderData.transaction_id || '',
      'Status': 'Pending',
      'Notes': orderData.notes || '',
      'Order Date': new Date().toISOString().split('T')[0],
    };

    // Link Customer Name field to Customers table record
    if (customerRecordId) {
      orderFields['Customer Name'] = [customerRecordId];
    }

    const orderRes = await fetch(`${baseUrl}/Orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ records: [{ fields: orderFields }] }),
    });

    let orderRecordId = '';
    if (orderRes.ok) {
      const orderResData = await orderRes.json();
      orderRecordId = orderResData.records?.[0]?.id || '';
    } else {
      const err = await orderRes.text();
      console.error('Airtable Orders error:', err);
    }

    // 3. Create Order Items with linked Order record ID
    const items = orderData.items || [];
    if (items.length > 0) {
      const itemRecords = items.map((item: any) => {
        const fields: Record<string, unknown> = {
          'Product Name': item.title || '',
          'Quantity': item.quantity || 1,
          'Unit Price': item.price || 0,
          'Product Link': item.slug ? `https://rikapio.lovable.app/p/${item.slug}` : '',
        };
        // Link Order ID field to Orders table record
        if (orderRecordId) {
          fields['Order ID'] = [orderRecordId];
        }
        return { fields };
      });

      const itemRes = await fetch(`${baseUrl}/Order%20Items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ records: itemRecords }),
      });
      if (!itemRes.ok) {
        const err = await itemRes.text();
        console.error('Airtable Order Items error:', err);
      }
    }

    // 4. Update Customer record with linked Orders field
    if (customerRecordId && orderRecordId) {
      const updateRes = await fetch(`${baseUrl}/Customers/${customerRecordId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          fields: {
            'Orders': [orderRecordId],
          },
        }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.text();
        console.error('Airtable Customer Orders link error:', err);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Airtable sync error:', error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
