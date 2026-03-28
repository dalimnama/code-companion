import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.12";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

async function fetchSiteSettings(): Promise<Record<string, string>> {
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key);
    const { data } = await sb.from("site_settings").select("key, value");
    const map: Record<string, string> = {};
    data?.forEach((r: any) => { map[r.key] = r.value; });
    return map;
  } catch { return {}; }
}

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
  if (typeof order.customer_email !== "string" || order.customer_email.length > 255) return "Invalid customer_email";
  if (order.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customer_email)) return "Invalid email format";
  if (typeof order.total !== "number" || order.total < 0) return "Invalid total";
  if (!Array.isArray(order.items) || order.items.length === 0) return "Invalid items";
  return null;
}

function buildItemsHtml(items: any[], siteUrl: string) {
  return items
    .map((item: any) => {
      const productLink = item.slug ? `${siteUrl}/p/${item.slug}` : "";
      const linkHtml = productLink
        ? `<br/><a href="${productLink}" style="color:#16a34a;font-size:12px;">🔗 প্রোডাক্ট দেখুন</a>`
        : "";
      const sizeHtml = item.size ? ` <span style="color:#6b7280;font-size:12px;">(সাইজ: ${item.size})</span>` : "";
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">
          <img src="${item.image}" width="50" height="50" style="border-radius:6px;object-fit:cover;" />
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.title}${sizeHtml}${linkHtml}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">৳${item.price * item.quantity}</td>
      </tr>`;
    })
    .join("");
}

function buildPricingHtml(order: any) {
  return `
    <table style="width:100%;">
      <tr><td style="padding:4px 0;color:#6b7280;">সাবটোটাল:</td><td style="text-align:right;">৳${order.subtotal}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">শিপিং:</td><td style="text-align:right;">৳${order.shipping_cost}</td></tr>
      ${order.discount_amount > 0 ? `<tr><td style="padding:4px 0;color:#16a34a;">ডিসকাউন্ট:</td><td style="text-align:right;color:#16a34a;">-৳${order.discount_amount}</td></tr>` : ""}
      <tr style="font-size:18px;font-weight:bold;"><td style="padding:8px 0;border-top:2px solid #16a34a;">মোট:</td><td style="text-align:right;padding:8px 0;border-top:2px solid #16a34a;">৳${order.total}</td></tr>
    </table>
  `;
}

function buildAdminEmailHtml(order: any, itemsHtml: string, pricingHtml: string) {
  const dateStr = new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h1 style="color:#16a34a;border-bottom:2px solid #16a34a;padding-bottom:10px;">🛒 নতুন অর্ডার পেয়েছেন!</h1>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:16px;">
        <h2 style="margin:0 0 8px;">অর্ডার আইডি: ${order.order_id}</h2>
        <p style="margin:0;color:#6b7280;">তারিখ: ${dateStr}</p>
      </div>
      <h3>👤 কাস্টমার তথ্য</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tr><td style="padding:4px 8px;color:#6b7280;">নাম:</td><td style="padding:4px 8px;font-weight:bold;">${order.customer_name}</td></tr>
        <tr><td style="padding:4px 8px;color:#6b7280;">ফোন:</td><td style="padding:4px 8px;font-weight:bold;">${order.customer_phone}</td></tr>
        <tr><td style="padding:4px 8px;color:#6b7280;">ইমেইল:</td><td style="padding:4px 8px;">${order.customer_email}</td></tr>
      </table>
      <h3>📍 ডেলিভারি ঠিকানা</h3>
      <p style="background:#f9fafb;padding:12px;border-radius:8px;">
        ${order.address}, ${order.area}, ${order.city}<br/>
        <strong>শিপিং:</strong> ${order.shipping_method === "inside-dhaka" ? "ঢাকার ভিতরে" : "ঢাকার বাইরে"}
      </p>
      <h3>💳 পেমেন্ট</h3>
      <p style="background:#f9fafb;padding:12px;border-radius:8px;">
        <strong>পদ্ধতি:</strong> ${order.payment_method === "cod" ? "ক্যাশ অন ডেলিভারি" : order.payment_method === "bkash" ? "বিকাশ" : "নগদ"}
        ${order.transaction_id ? `<br/><strong>TxnID:</strong> ${order.transaction_id}` : ""}
      </p>
      ${order.notes ? `<h3>📝 নোট</h3><p style="background:#fff3cd;padding:12px;border-radius:8px;">${order.notes}</p>` : ""}
      <h3>📦 প্রোডাক্ট</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;">
          <th style="padding:8px;text-align:left;">ছবি</th>
          <th style="padding:8px;text-align:left;">প্রোডাক্ট</th>
          <th style="padding:8px;text-align:center;">পরিমাণ</th>
          <th style="padding:8px;text-align:right;">মূল্য</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="margin-top:16px;background:#f0fdf4;padding:16px;border-radius:8px;border:1px solid #bbf7d0;">
        ${pricingHtml}
      </div>
    </div>
  `;
}

function buildCustomerEmailHtml(order: any, itemsHtml: string, pricingHtml: string, siteUrl: string, brandPhone: string, brandName: string) {
  const dateStr = new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });
  const trackUrl = `${siteUrl}/track-order/${order.order_id}`;
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:#f0fdf4;padding:20px;border-radius:12px;border:1px solid #bbf7d0;text-align:center;margin-bottom:20px;">
        <div style="font-size:48px;margin-bottom:8px;">✅</div>
        <h1 style="margin:0 0 4px;color:#166534;font-size:22px;">অর্ডার সফলভাবে সম্পন্ন হয়েছে!</h1>
        <p style="margin:0;color:#6b7280;font-size:14px;">অর্ডার আইডি: <strong>${order.order_id}</strong></p>
        <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">তারিখ: ${dateStr}</p>
      </div>
      <p style="font-size:15px;color:#374151;">প্রিয় <strong>${order.customer_name}</strong>,</p>
      <p style="font-size:14px;color:#6b7280;">আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে। আমরা দ্রুত আপনার প্রোডাক্ট পাঠানোর ব্যবস্থা করছি।</p>
      <div style="text-align:center;margin:20px 0;">
        <a href="${trackUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">📦 অর্ডার ট্র্যাক করুন</a>
      </div>
      <h3 style="border-bottom:1px solid #e5e7eb;padding-bottom:8px;">📦 আপনার প্রোডাক্ট</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f3f4f6;">
          <th style="padding:8px;text-align:left;">ছবি</th>
          <th style="padding:8px;text-align:left;">প্রোডাক্ট</th>
          <th style="padding:8px;text-align:center;">পরিমাণ</th>
          <th style="padding:8px;text-align:right;">মূল্য</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="margin-top:16px;background:#f9fafb;padding:16px;border-radius:8px;">
        ${pricingHtml}
      </div>
      <h3 style="margin-top:20px;">📍 ডেলিভারি ঠিকানা</h3>
      <p style="background:#f9fafb;padding:12px;border-radius:8px;font-size:14px;">
        ${order.address}, ${order.area}, ${order.city}<br/>
        <strong>শিপিং:</strong> ${order.shipping_method === "inside-dhaka" ? "ঢাকার ভিতরে" : "ঢাকার বাইরে"}
      </p>
      <h3>💳 পেমেন্ট</h3>
      <p style="background:#f9fafb;padding:12px;border-radius:8px;font-size:14px;">
        <strong>পদ্ধতি:</strong> ${order.payment_method === "cod" ? "ক্যাশ অন ডেলিভারি" : order.payment_method === "bkash" ? "বিকাশ" : "নগদ"}
        ${order.transaction_id ? `<br/><strong>TxnID:</strong> ${order.transaction_id}` : ""}
      </p>
      <div style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:8px;text-align:center;border:1px solid #bbf7d0;">
        <p style="margin:0;font-size:14px;color:#6b7280;">কোনো প্রশ্ন থাকলে যোগাযোগ করুন</p>
        <p style="margin:4px 0 0;font-weight:bold;color:#16a34a;">📞 ${brandPhone}</p>
      </div>
      <p style="margin-top:24px;text-align:center;color:#9ca3af;font-size:12px;">© ${brandName} — আপনার বিশ্বস্ত অনলাইন শপ</p>
    </div>
  `;
}

function createGmailTransporter() {
  const user = Deno.env.get("GMAIL_USER");
  const pass = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!user || !pass) throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD not configured");
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const order = await req.json();

    const validationError = validateOrder(order);
    if (validationError) {
      return new Response(JSON.stringify({ success: false, error: validationError }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://rikapio.lovable.app";
    const settings = await fetchSiteSettings();
    const brandName = settings.logo_text || "rikapio";
    const brandPhone = settings.phone || "01840469120";
    const transporter = createGmailTransporter();
    const gmailUser = Deno.env.get("GMAIL_USER")!;

    const itemsHtml = buildItemsHtml(order.items, siteUrl);
    const pricingHtml = buildPricingHtml(order);

    // Send admin notification email via Gmail SMTP
    let adminEmailId = null;
    try {
      const adminHtml = buildAdminEmailHtml(order, itemsHtml, pricingHtml);
      const adminInfo = await transporter.sendMail({
        from: `"${brandName}" <${gmailUser}>`,
        to: settings.email || gmailUser,
        subject: `🛒 নতুন অর্ডার: ${order.order_id} — ৳${order.total}`,
        html: adminHtml,
      });
      adminEmailId = adminInfo.messageId || "sent";
    } catch (e) {
      console.error("Admin email error:", e);
    }

    // Send customer confirmation email via Gmail SMTP
    let customerEmailId = null;
    if (order.customer_email) {
      const customerHtml = buildCustomerEmailHtml(order, itemsHtml, pricingHtml, siteUrl, brandPhone, brandName);
      const info = await transporter.sendMail({
        from: `"${brandName}" <${gmailUser}>`,
        to: order.customer_email,
        subject: `✅ অর্ডার কনফার্ম হয়েছে — ${order.order_id}`,
        html: customerHtml,
      });
      customerEmailId = info.messageId || "sent";
    }

    return new Response(JSON.stringify({ success: true, adminEmailId, customerEmailId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending order email:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
