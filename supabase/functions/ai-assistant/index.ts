import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, language = "bn", userName, imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract last user message for smart context
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const lowerMsg = lastUserMsg.toLowerCase();

    // Smart product search: fetch relevant products based on user query
    let productQuery = supabase.from("products").select("title, slug, price, compare_at_price, stock, is_flash_sale, short_description, tags, is_featured, is_new, category_id").eq("is_active", true);
    
    // If user asks about specific things, try to filter
    if (lowerMsg.includes('অফার') || lowerMsg.includes('ডিসকাউন্ট') || lowerMsg.includes('সেল') || lowerMsg.includes('offer') || lowerMsg.includes('sale')) {
      productQuery = productQuery.not('compare_at_price', 'is', null).order('compare_at_price', { ascending: false }).limit(20);
    } else if (lowerMsg.includes('জনপ্রিয়') || lowerMsg.includes('বেস্ট') || lowerMsg.includes('popular') || lowerMsg.includes('best')) {
      productQuery = productQuery.eq('is_featured', true).limit(20);
    } else if (lowerMsg.includes('নতুন') || lowerMsg.includes('new') || lowerMsg.includes('লেটেস্ট')) {
      productQuery = productQuery.eq('is_new', true).order('created_at', { ascending: false }).limit(20);
    } else if (lowerMsg.includes('ফ্ল্যাশ') || lowerMsg.includes('flash')) {
      productQuery = productQuery.eq('is_flash_sale', true).limit(20);
    } else {
      productQuery = productQuery.limit(50);
    }

    const [productsRes, categoriesRes, settingsRes] = await Promise.all([
      productQuery,
      supabase.from("categories").select("name, name_bn, slug").eq("is_active", true),
      supabase.from("site_settings").select("key, value"),
    ]);

    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];
    const settings = settingsRes.data || [];

    const settingsMap = new Map(settings.map((item: { key: string; value: string }) => [item.key, item.value]));
    const getSetting = (key: string, fallback: string) => {
      const val = settingsMap.get(key);
      return typeof val === "string" && val.trim().length > 0 ? val.trim() : fallback;
    };

    const whatsapp = getSetting("whatsapp", "01840469120");
    const email = getSetting("email", "dalim6663@gmail.com");

    const aiBehaviorPrompt = getSetting(
      "ai_behavior_prompt",
      "You are a friendly, witty, and knowledgeable shopping buddy. Stay professional, modern, and human-like while being warm and helpful."
    );
    const aiResponseStylePrompt = getSetting(
      "ai_response_style_prompt",
      "Keep responses concise, clear, and engaging. Avoid robotic, overly formal, or repetitive phrasing."
    );
    const aiFirstMessagePrompt = getSetting(
      "ai_first_message_prompt",
      "Only in the first assistant reply, give a short friendly greeting. After that, directly continue with help without repeating greetings."
    );
    const aiAvoidPhrases = getSetting(
      "ai_avoid_phrases",
      "আসসালামু আলাইকুম, রিকাপিও এআই- তে আপনাকে স্বাগতম"
    );

    // Order tracking with enhanced context
    const orderIdMatch = lastUserMsg.match(/[A-Z0-9]{6,}/i);
    let orderContext = '';
    if (orderIdMatch) {
      const possibleOrderId = orderIdMatch[0].toUpperCase();
      const { data: orderData } = await supabase
        .from("orders")
        .select("order_id, status, created_at, total, shipping_method, shipping_cost, items, customer_name, city, area, payment_method")
        .eq("order_id", possibleOrderId)
        .maybeSingle();
      if (orderData) {
        const statusMap: Record<string, string> = {
          pending: '⏳ পেন্ডিং — আপনার অর্ডার রিসিভ হয়েছে, শীঘ্রই প্রসেস করা হবে',
          processing: '🔄 প্রসেসিং — আপনার অর্ডার প্যাক করা হচ্ছে',
          shipped: '🚚 শিপড — আপনার পার্সেল কুরিয়ারে হস্তান্তর করা হয়েছে',
          delivered: '✅ ডেলিভার্ড — আপনার অর্ডার সফলভাবে পৌঁছে গেছে',
          cancelled: '❌ ক্যান্সেলড — এই অর্ডারটি বাতিল করা হয়েছে',
        };
        const items = Array.isArray(orderData.items) ? orderData.items : [];
        const itemList = items.map((item: any) => `${item.title || item.name} (x${item.quantity})`).join(', ');
        orderContext = `\n\n🔍 ORDER FOUND — SHARE THIS COMPLETE INFO:\n- অর্ডার আইডি: ${orderData.order_id}\n- স্ট্যাটাস: ${statusMap[orderData.status] || orderData.status}\n- মোট মূল্য: ৳${orderData.total}\n- শিপিং: ৳${orderData.shipping_cost} (${orderData.shipping_method})\n- পেমেন্ট: ${orderData.payment_method}\n- এলাকা: ${orderData.area}, ${orderData.city}\n- আইটেম: ${itemList || 'N/A'}\n- তারিখ: ${new Date(orderData.created_at).toLocaleDateString('bn-BD')}\n- ট্র্যাক লিঙ্ক: [📦 অর্ডার ট্র্যাক করুন](https://rikapio.shop/track-order/${orderData.order_id})`;
      }
    }

    const userGreeting = userName
      ? `\n\n👤 LOGGED-IN USER: The customer's name is "${userName}". Use their first name naturally in conversation (not in every message).`
      : '';

    const systemPrompt = `You are "rikapio AI" — a friendly, witty, and knowledgeable shopping buddy for rikapio, a Bangladeshi e-commerce store.

🔤 LANGUAGE: ALWAYS respond in বাংলা (Bangla). This is absolutely mandatory — no exceptions.
${userGreeting}

🧠 YOUR PERSONALITY & TONE:
- ${aiBehaviorPrompt}
- ${aiResponseStylePrompt}
- ${aiFirstMessagePrompt}
- Avoid repeating or using these words/phrases unnecessarily: ${aiAvoidPhrases}

🎯 YOUR CAPABILITIES:
1. 🛒 Product Expert: Recommend products, compare prices, suggest alternatives, highlight deals
2. 📦 Order Tracking: Check order status with detailed info — order IDs can be ANY format
3. 💬 Customer Support: Answer FAQs, explain policies, share contact info
4. 🎯 Smart Sales: Mention ongoing offers, low stock alerts, cross-sell based on interest
5. 🔍 Product Search: Help customers find exactly what they need

📋 STORE POLICIES:
- 📞 Phone: ${whatsapp}
- 📧 Email: ${email}
- 💳 Payment: Cash on Delivery (COD), bKash, Nagad
- 🚚 Shipping: ঢাকার ভিতরে ৳60 (2-3 দিন), ঢাকার বাইরে ৳120 (4-7 দিন)
- 🔄 Return: 7 দিনের রিটার্ন পলিসি
- ✅ 100% অথেন্টিক পণ্য গ্যারান্টি

📁 CATEGORIES:
${categories.map(c => `- [${c.name_bn}](https://rikapio.shop/c/${c.slug})`).join("\n")}

📦 PRODUCTS:
${products.map(p => {
  const discount = p.compare_at_price ? `~~৳${p.compare_at_price}~~ → ৳${p.price} (${Math.round((1 - p.price / p.compare_at_price) * 100)}% OFF)` : `৳${p.price}`;
  const flash = p.is_flash_sale ? " 🔥 ফ্ল্যাশ সেল!" : "";
  const newBadge = p.is_new ? " 🆕" : "";
  const stockInfo = p.stock <= 3 ? ` ⚠️ মাত্র ${p.stock}টি বাকি!` : p.stock <= 0 ? " ❌ স্টক আউট" : "";
  return `- [${p.title}](https://rikapio.shop/p/${p.slug}): ${discount}${flash}${newBadge}${stockInfo}`;
}).join("\n")}
${orderContext}

📌 RESPONSE RULES:
1. ALWAYS respond in বাংলা
2. ALWAYS use full clickable markdown links: [Name](https://rikapio.shop/p/slug) or [Category](https://rikapio.shop/c/slug)
3. For order tracking: if ORDER FOUND info is above, share it nicely formatted. Otherwise ask for order ID
4. Track link format: [📦 অর্ডার ট্র্যাক করুন](https://rikapio.shop/track-order/ORDER_ID)
5. NEVER use relative paths — always full https://rikapio.shop URL
6. NEVER fabricate product info — only use what's listed above
7. If unsure, suggest contacting support via phone/email
8. Keep responses concise but helpful (3-6 sentences ideal)
9. When recommending products, show 2-4 options max with prices and links
10. If product is low stock, create urgency naturally
11. If a product has a discount, always highlight the savings
12. End responses with a helpful follow-up question when appropriate`;

    // Build messages with multimodal support
    const apiMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    for (const msg of messages) {
      if (msg.role === 'user' && msg.content?.includes('[ছবি সংযুক্ত:')) {
        // Extract image URL from the message
        const imgMatch = msg.content.match(/\[ছবি সংযুক্ত: (https?:\/\/[^\]]+)\]/);
        const textContent = msg.content.replace(/\[ছবি সংযুক্ত: https?:\/\/[^\]]+\]/, '').trim();
        const parts: any[] = [];
        if (textContent) parts.push({ type: "text", text: textContent });
        if (imgMatch?.[1]) parts.push({ type: "image_url", image_url: { url: imgMatch[1] } });
        apiMessages.push({ role: msg.role, content: parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts });
      } else {
        apiMessages.push(msg);
      }
    }

    // Use a vision-capable model when image is present
    const hasImage = !!imageUrl || messages.some((m: any) => m.content?.includes('[ছবি সংযুক্ত:'));
    const model = hasImage ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
