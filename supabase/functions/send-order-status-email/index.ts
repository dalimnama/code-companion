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

function buildItemsHtml(items: any[]) {
  return items
    .map(
      (item: any) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">
          <img src="${item.image}" width="50" height="50" style="border-radius:6px;object-fit:cover;" />
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.title}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">৳${item.price * item.quantity}</td>
      </tr>`
    )
    .join("");
}

function buildItemsTable(itemsHtml: string) {
  return `
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#f3f4f6;">
        <th style="padding:8px;text-align:left;">ছবি</th>
        <th style="padding:8px;text-align:left;">প্রোডাক্ট</th>
        <th style="padding:8px;text-align:center;">পরিমাণ</th>
        <th style="padding:8px;text-align:right;">মূল্য</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
    </table>`;
}

function buildFooter(_siteUrl: string, brandPhone: string, brandName: string) {
  return `
    <div style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:8px;text-align:center;border:1px solid #bbf7d0;">
      <p style="margin:0;font-size:14px;color:#6b7280;">কোনো প্রশ্ন থাকলে যোগাযোগ করুন</p>
      <p style="margin:4px 0 0;font-weight:bold;color:#16a34a;">📞 ${brandPhone}</p>
    </div>
    <p style="margin-top:24px;text-align:center;color:#9ca3af;font-size:12px;">© ${brandName} — আপনার বিশ্বস্ত অনলাইন শপ</p>
  </div>`;
}

function buildHeader(_siteUrl: string) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">`;
}

function buildConfirmedEmail(order: any, siteUrl: string, brandPhone: string, brandName: string) {
  const dateStr = new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });
  const trackUrl = `${siteUrl}/track-order/${order.order_id}`;
  const itemsHtml = buildItemsHtml(order.items as any[]);
  return `${buildHeader(siteUrl)}
    <div style="background:#ecfdf5;padding:20px;border-radius:12px;border:1px solid #6ee7b7;text-align:center;margin-bottom:20px;">
      <div style="font-size:48px;margin-bottom:8px;">✅</div>
      <h1 style="margin:0 0 4px;color:#059669;font-size:22px;">আপনার অর্ডার কনফার্ম হয়েছে!</h1>
      <p style="margin:0;color:#6b7280;font-size:14px;">অর্ডার আইডি: <strong>${order.order_id}</strong></p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">তারিখ: ${dateStr}</p>
    </div>
    <p style="font-size:15px;color:#374151;">প্রিয় <strong>${order.customer_name}</strong>,</p>
    <p style="font-size:14px;color:#6b7280;">আপনার অর্ডার সফলভাবে কনফার্ম করা হয়েছে। আমরা শীঘ্রই আপনার প্রোডাক্ট প্রস্তুত করে শিপিং এর ব্যবস্থা করবো।</p>
    <h3 style="border-bottom:1px solid #e5e7eb;padding-bottom:8px;">📦 অর্ডারকৃত প্রোডাক্ট</h3>
    ${buildItemsTable(itemsHtml)}
    <div style="margin-top:16px;background:#f9fafb;padding:16px;border-radius:8px;">
      <table style="width:100%;"><tr style="font-size:18px;font-weight:bold;"><td style="padding:4px 0;">মোট:</td><td style="text-align:right;">৳${order.total}</td></tr></table>
    </div>
    <div style="text-align:center;margin:20px 0;">
      <a href="${trackUrl}" style="display:inline-block;background:#059669;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">📦 অর্ডার ট্র্যাক করুন</a>
    </div>
    ${buildFooter(siteUrl, brandPhone, brandName)}`;
}

function buildProcessingEmail(order: any, siteUrl: string, brandPhone: string, brandName: string) {
  const dateStr = new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });
  const trackUrl = `${siteUrl}/track-order/${order.order_id}`;
  const itemsHtml = buildItemsHtml(order.items as any[]);
  return `${buildHeader(siteUrl)}
    <div style="background:#eff6ff;padding:20px;border-radius:12px;border:1px solid #bfdbfe;text-align:center;margin-bottom:20px;">
      <div style="font-size:48px;margin-bottom:8px;">⚙️</div>
      <h1 style="margin:0 0 4px;color:#1d4ed8;font-size:22px;">আপনার অর্ডার প্রসেস হচ্ছে!</h1>
      <p style="margin:0;color:#6b7280;font-size:14px;">অর্ডার আইডি: <strong>${order.order_id}</strong></p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">তারিখ: ${dateStr}</p>
    </div>
    <p style="font-size:15px;color:#374151;">প্রিয় <strong>${order.customer_name}</strong>,</p>
    <p style="font-size:14px;color:#6b7280;">আপনার অর্ডার আমরা পেয়েছি এবং প্রসেসিং শুরু হয়েছে। শীঘ্রই আপনার প্রোডাক্ট শিপ করা হবে।</p>
    <h3 style="border-bottom:1px solid #e5e7eb;padding-bottom:8px;">📦 অর্ডারকৃত প্রোডাক্ট</h3>
    ${buildItemsTable(itemsHtml)}
    <div style="margin-top:16px;background:#f9fafb;padding:16px;border-radius:8px;">
      <table style="width:100%;"><tr style="font-size:18px;font-weight:bold;"><td style="padding:4px 0;">মোট:</td><td style="text-align:right;">৳${order.total}</td></tr></table>
    </div>
    <div style="text-align:center;margin:20px 0;">
      <a href="${trackUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">📦 অর্ডার ট্র্যাক করুন</a>
    </div>
    ${buildFooter(siteUrl, brandPhone, brandName)}`;
}

function buildShippedEmail(order: any, siteUrl: string, brandPhone: string, brandName: string) {
  const dateStr = new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });
  const trackUrl = `${siteUrl}/track-order/${order.order_id}`;
  const itemsHtml = buildItemsHtml(order.items as any[]);
  return `${buildHeader(siteUrl)}
    <div style="background:#f5f3ff;padding:20px;border-radius:12px;border:1px solid #c4b5fd;text-align:center;margin-bottom:20px;">
      <div style="font-size:48px;margin-bottom:8px;">🚚</div>
      <h1 style="margin:0 0 4px;color:#7c3aed;font-size:22px;">আপনার অর্ডার শিপ করা হয়েছে!</h1>
      <p style="margin:0;color:#6b7280;font-size:14px;">অর্ডার আইডি: <strong>${order.order_id}</strong></p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">তারিখ: ${dateStr}</p>
    </div>
    <p style="font-size:15px;color:#374151;">প্রিয় <strong>${order.customer_name}</strong>,</p>
    <p style="font-size:14px;color:#6b7280;">আপনার অর্ডার শিপ করা হয়েছে এবং শীঘ্রই আপনার ঠিকানায় পৌঁছে যাবে। দয়া করে ফোন রিসিভ করুন।</p>
    <h3 style="border-bottom:1px solid #e5e7eb;padding-bottom:8px;">📦 শিপ হওয়া প্রোডাক্ট</h3>
    ${buildItemsTable(itemsHtml)}
    <div style="margin-top:16px;background:#f9fafb;padding:16px;border-radius:8px;">
      <table style="width:100%;"><tr style="font-size:18px;font-weight:bold;"><td style="padding:4px 0;">মোট:</td><td style="text-align:right;">৳${order.total}</td></tr></table>
    </div>
    <div style="text-align:center;margin:20px 0;">
      <a href="${trackUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">📦 অর্ডার ট্র্যাক করুন</a>
    </div>
    ${buildFooter(siteUrl, brandPhone, brandName)}`;
}

function buildDeliveredEmail(order: any, siteUrl: string, brandPhone: string, brandName: string) {
  const dateStr = new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });
  const trackUrl = `${siteUrl}/track-order/${order.order_id}`;
  const itemsHtml = buildItemsHtml(order.items as any[]);
  return `${buildHeader(siteUrl)}
    <div style="background:#f0fdf4;padding:20px;border-radius:12px;border:1px solid #bbf7d0;text-align:center;margin-bottom:20px;">
      <div style="font-size:48px;margin-bottom:8px;">📦✅</div>
      <h1 style="margin:0 0 4px;color:#166534;font-size:22px;">আপনার অর্ডার ডেলিভারি হয়েছে!</h1>
      <p style="margin:0;color:#6b7280;font-size:14px;">অর্ডার আইডি: <strong>${order.order_id}</strong></p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">তারিখ: ${dateStr}</p>
    </div>
    <p style="font-size:15px;color:#374151;">প্রিয় <strong>${order.customer_name}</strong>,</p>
    <p style="font-size:14px;color:#6b7280;">আপনার অর্ডার সফলভাবে ডেলিভারি হয়েছে। আশা করি আপনি প্রোডাক্ট নিয়ে সন্তুষ্ট। কোনো সমস্যা থাকলে আমাদের সাথে যোগাযোগ করুন।</p>
    <h3 style="border-bottom:1px solid #e5e7eb;padding-bottom:8px;">📦 ডেলিভারি হওয়া প্রোডাক্ট</h3>
    ${buildItemsTable(itemsHtml)}
    <div style="margin-top:16px;background:#f9fafb;padding:16px;border-radius:8px;">
      <table style="width:100%;"><tr style="font-size:18px;font-weight:bold;"><td style="padding:4px 0;">মোট:</td><td style="text-align:right;">৳${order.total}</td></tr></table>
    </div>
    <div style="text-align:center;margin:20px 0;">
      <a href="${trackUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">📦 অর্ডার বিস্তারিত দেখুন</a>
    </div>
    ${buildFooter(siteUrl, brandPhone, brandName)}`;
}

function buildCancelledEmail(order: any, siteUrl: string, brandPhone: string, brandName: string) {
  const dateStr = new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });
  const itemsHtml = buildItemsHtml(order.items as any[]);
  return `${buildHeader(siteUrl)}
    <div style="background:#fef2f2;padding:20px;border-radius:12px;border:1px solid #fecaca;text-align:center;margin-bottom:20px;">
      <div style="font-size:48px;margin-bottom:8px;">❌</div>
      <h1 style="margin:0 0 4px;color:#dc2626;font-size:22px;">আপনার অর্ডার বাতিল করা হয়েছে</h1>
      <p style="margin:0;color:#6b7280;font-size:14px;">অর্ডার আইডি: <strong>${order.order_id}</strong></p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">তারিখ: ${dateStr}</p>
    </div>
    <p style="font-size:15px;color:#374151;">প্রিয় <strong>${order.customer_name}</strong>,</p>
    <p style="font-size:14px;color:#6b7280;">দুঃখিত, আপনার অর্ডার বাতিল করা হয়েছে। যদি আপনি পেমেন্ট করে থাকেন, তাহলে রিফান্ড প্রক্রিয়া শীঘ্রই সম্পন্ন হবে।</p>
    <h3 style="border-bottom:1px solid #e5e7eb;padding-bottom:8px;">📦 বাতিল হওয়া প্রোডাক্ট</h3>
    ${buildItemsTable(itemsHtml)}
    <div style="margin-top:16px;background:#fef2f2;padding:16px;border-radius:8px;border:1px solid #fecaca;">
      <table style="width:100%;"><tr style="font-size:18px;font-weight:bold;"><td style="padding:4px 0;">মোট:</td><td style="text-align:right;"><s>৳${order.total}</s></td></tr></table>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${siteUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">🛒 আবার শপিং করুন</a>
    </div>
    ${buildFooter(siteUrl, brandPhone, brandName)}`;
}

const statusConfig: Record<string, { subject: (id: string) => string; builder: (order: any, siteUrl: string, brandPhone: string, brandName: string) => string }> = {
  confirmed: { subject: (id) => `✅ অর্ডার কনফার্ম হয়েছে — ${id}`, builder: buildConfirmedEmail },
  processing: { subject: (id) => `⚙️ অর্ডার প্রসেসিং — ${id}`, builder: buildProcessingEmail },
  shipped: { subject: (id) => `🚚 অর্ডার শিপ হয়েছে — ${id}`, builder: buildShippedEmail },
  delivered: { subject: (id) => `📦 অর্ডার ডেলিভারি হয়েছে — ${id}`, builder: buildDeliveredEmail },
  cancelled: { subject: (id) => `❌ অর্ডার বাতিল — ${id}`, builder: buildCancelledEmail },
};

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
    const { order, status } = await req.json();

    if (!order || !status) {
      return new Response(JSON.stringify({ success: false, error: "Missing order or status" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order.customer_email) {
      return new Response(JSON.stringify({ success: false, error: "No customer email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = statusConfig[status];
    if (!config) {
      return new Response(JSON.stringify({ success: false, error: "Unsupported status type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://rikapio.lovable.app";
    const settings = await fetchSiteSettings();
    const brandName = settings.logo_text || "rikapio";
    const brandPhone = settings.phone || "01840469120";
    const subject = config.subject(order.order_id);
    const html = config.builder(order, siteUrl, brandPhone, brandName);

    const transporter = createGmailTransporter();
    const gmailUser = Deno.env.get("GMAIL_USER")!;

    const info = await transporter.sendMail({
      from: `"${brandName}" <${gmailUser}>`,
      to: order.customer_email,
      subject,
      html,
    });

    return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending status email:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
