import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function validateOrder(order: any): string | null {
  if (!order || typeof order !== "object") return "Invalid order data";
  if (typeof order.order_id !== "string" || order.order_id.length > 50) return "Invalid order_id";
  if (typeof order.customer_name !== "string" || order.customer_name.length > 200) return "Invalid customer_name";
  if (typeof order.customer_phone !== "string" || order.customer_phone.length > 20) return "Invalid customer_phone";
  if (typeof order.total !== "number" || order.total < 0) return "Invalid total";
  if (!Array.isArray(order.items) || order.items.length === 0) return "Invalid items";
  return null;
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

    const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
    if (!CHAT_ID) throw new Error("TELEGRAM_CHAT_ID is not configured");

    const order = await req.json();

    // Validate input
    const validationError = validateOrder(order);
    if (validationError) {
      return new Response(JSON.stringify({ success: false, error: validationError }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://rikapio.lovable.app";
    const itemsList = order.items
      .map((item: any) => {
        const productLink = item.slug ? `${siteUrl}/p/${item.slug}` : "";
        const linkPart = productLink ? ` [🔗 দেখুন](${escapeMarkdown(productLink)})` : "";
        const sizePart = item.size ? ` \\(${escapeMarkdown(item.size)}\\)` : "";
        return `  • ${escapeMarkdown(item.title)}${sizePart} × ${item.quantity} \\= ৳${item.price * item.quantity}${linkPart}`;
      })
      .join("\n");

    const message = `🛒 *নতুন অর্ডার পেয়েছেন\\!*

📋 *অর্ডার আইডি:* \`${order.order_id}\`

👤 *কাস্টমার তথ্য:*
  নাম: ${escapeMarkdown(order.customer_name)}
  ফোন: ${escapeMarkdown(order.customer_phone)}
  ইমেইল: ${escapeMarkdown(order.customer_email)}

📍 *ডেলিভারি ঠিকানা:*
  ${escapeMarkdown(order.address)}, ${escapeMarkdown(order.area)}, ${escapeMarkdown(order.city)}
  শিপিং: ${order.shipping_method === "inside-dhaka" ? "ঢাকার ভিতরে \\(৳60\\)" : "ঢাকার বাইরে \\(৳120\\)"}

💳 *পেমেন্ট:*
  পদ্ধতি: ${order.payment_method === "cod" ? "ক্যাশ অন ডেলিভারি" : order.payment_method === "bkash" ? "বিকাশ" : "নগদ"}${order.transaction_id ? `\n  TxnID: \`${order.transaction_id}\`` : ""}

📦 *প্রোডাক্ট:*
${itemsList}

💰 *মূল্য:*
  সাবটোটাল: ৳${order.subtotal}
  শিপিং: ৳${order.shipping_cost}${order.discount_amount > 0 ? `\n  ডিসকাউন্ট: \\-৳${order.discount_amount}` : ""}
  *মোট: ৳${order.total}*${order.notes ? `\n\n📝 *নোট:* ${escapeMarkdown(order.notes)}` : ""}`;

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "MarkdownV2",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Telegram API error [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending Telegram message:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
