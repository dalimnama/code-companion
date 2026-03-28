import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  size?: string;
  slug?: string;
}

function escapeMarkdown(text: string): string {
  return String(text).replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

function escapeUrl(url: string): string {
  return url.replace(/[)\\]/g, "\\$&");
}

function formatBDT(n: number): string {
  return `৳${n.toLocaleString("en-BD")}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
    const GMAIL_USER = Deno.env.get("GMAIL_USER")!;
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const siteUrl = "https://rikapio.lovable.app";

    // Fetch dynamic settings
    const { data: settingsData } = await supabase.from("site_settings").select("key, value");
    const settings: Record<string, string> = {};
    settingsData?.forEach((r: any) => { settings[r.key] = r.value; });
    const brandName = settings.logo_text || "rikapio";
    const adminEmail = settings.email || "rikapioshop@gmail.com";

    // Determine report type
    let reportType = "daily";
    try {
      const body = await req.json();
      if (body?.type) reportType = body.type;
    } catch { /* default daily */ }

    const now = new Date();
    const bdNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));

    let startDate: Date;
    let periodLabel: string;

    if (reportType === "yearly") {
      startDate = new Date(bdNow.getFullYear(), 0, 1);
      periodLabel = `বার্ষিক রিপোর্ট ${bdNow.getFullYear()}`;
    } else if (reportType === "monthly") {
      startDate = new Date(bdNow.getFullYear(), bdNow.getMonth(), 1);
      const months = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];
      periodLabel = `মাসিক রিপোর্ট — ${months[bdNow.getMonth()]} ${bdNow.getFullYear()}`;
    } else {
      startDate = new Date(bdNow.getFullYear(), bdNow.getMonth(), bdNow.getDate() - 1);
      const dateStr = startDate.toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" });
      periodLabel = `দৈনিক রিপোর্ট — ${dateStr}`;
    }

    const startISO = startDate.toISOString();
    const endISO = reportType === "daily"
      ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1).toISOString()
      : now.toISOString();

    // Fetch orders in period
    const { data: orders = [] } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", startISO)
      .lt("created_at", endISO)
      .order("created_at", { ascending: false });

    // Calculate stats
    const totalOrders = orders.length;
    const statusCount: Record<string, number> = {};
    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalShipping = 0;
    const productSales: Record<string, { title: string; qty: number; revenue: number; slug: string }> = {};
    const paymentMethods: Record<string, number> = {};

    orders.forEach((order: any) => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
      totalRevenue += Number(order.total) || 0;
      totalDiscount += Number(order.discount_amount) || 0;
      totalShipping += Number(order.shipping_cost) || 0;
      paymentMethods[order.payment_method] = (paymentMethods[order.payment_method] || 0) + 1;

      const items = (order.items as OrderItem[]) || [];
      items.forEach((item) => {
        const key = item.title || item.id;
        if (!productSales[key]) {
          productSales[key] = { title: item.title || "Unknown", qty: 0, revenue: 0, slug: item.slug || "" };
        }
        productSales[key].qty += item.quantity || 1;
        productSales[key].revenue += (item.price || 0) * (item.quantity || 1);
        if (item.slug && !productSales[key].slug) productSales[key].slug = item.slug;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    const statusLabels: Record<string, string> = {
      pending: "পেন্ডিং", confirmed: "কনফার্মড", processing: "প্রসেসিং",
      shipped: "শিপড", delivered: "ডেলিভার্ড", cancelled: "ক্যান্সেলড",
    };
    const paymentLabels: Record<string, string> = {
      cod: "ক্যাশ অন ডেলিভারি", bkash: "বিকাশ", nagad: "নগদ",
    };

    const delivered = statusCount["delivered"] || 0;
    const cancelled = statusCount["cancelled"] || 0;
    const pending = statusCount["pending"] || 0;
    const shipped = statusCount["shipped"] || 0;

    // ── Telegram message with product links ──
    const topProductLines = topProducts.map((p, i) => {
      const link = p.slug ? `${siteUrl}/p/${p.slug}` : "";
      const linkPart = link ? ` [🔗 দেখুন](${escapeUrl(link)})` : "";
      return `  ${i + 1}\\. ${escapeMarkdown(p.title)} — ${p.qty} পিচ — ${escapeMarkdown(formatBDT(p.revenue))}${linkPart}`;
    }).join("\n");

    const statusLines = Object.entries(statusCount)
      .map(([s, c]) => `  ${escapeMarkdown(statusLabels[s] || s)}: ${c}`)
      .join("\n");

    const paymentLines = Object.entries(paymentMethods)
      .map(([m, c]) => `  ${escapeMarkdown(paymentLabels[m] || m)}: ${c}`)
      .join("\n");

    const telegramMsg = `📊 *${escapeMarkdown(periodLabel)}*

📦 *অর্ডার সামারি:*
  মোট অর্ডার: ${totalOrders}
${statusLines}

💰 *সেলস সামারি:*
  মোট সেলস: ${escapeMarkdown(formatBDT(totalRevenue))}
  মোট শিপিং: ${escapeMarkdown(formatBDT(totalShipping))}
  মোট ডিসকাউন্ট: ${escapeMarkdown(formatBDT(totalDiscount))}
  নেট রেভিনিউ: ${escapeMarkdown(formatBDT(totalRevenue - totalDiscount))}

🚚 *ডেলিভারি রিপোর্ট:*
  ডেলিভার্ড: ${delivered}
  শিপড: ${shipped}
  পেন্ডিং: ${pending}
  ক্যান্সেলড: ${cancelled}

💳 *পেমেন্ট মেথড:*
${paymentLines}

🏆 *টপ সেলিং প্রোডাক্ট:*
${topProductLines || "  কোন সেলস নেই"}`;

    // Send Telegram
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: telegramMsg, parse_mode: "MarkdownV2" }),
      });
      const tgData = await tgRes.json();
      if (!tgRes.ok) console.error("Telegram API error:", tgData);
    } catch (e) {
      console.error("Telegram error:", e);
    }

    // ── Build Email HTML ──
    const topProductRowsHtml = topProducts.map((p, i) => {
      const link = p.slug ? `${siteUrl}/p/${p.slug}` : "";
      const linkHtml = link ? `<br/><a href="${link}" style="color:#2563eb;font-size:11px;text-decoration:none">🔗 দেখুন</a>` : "";
      return `<tr><td style="padding:6px;border-bottom:1px solid #eee;width:20px">${i + 1}</td><td style="padding:6px;border-bottom:1px solid #eee">${p.title}${linkHtml}</td><td style="padding:6px;border-bottom:1px solid #eee;text-align:center;white-space:nowrap">${p.qty} পিচ</td><td style="padding:6px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${formatBDT(p.revenue)}</td></tr>`;
    }).join("");

    const statusRowsHtml = Object.entries(statusCount)
      .map(([s, c]) => `<tr><td style="padding:4px 10px;border-bottom:1px solid #eee">${statusLabels[s] || s}</td><td style="padding:4px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${c}</td></tr>`)
      .join("");

    const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:Arial,sans-serif;background:#f4f5f7;margin:0;padding:10px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden">
  <tr>
    <td style="background:#1a1a2e;color:#ffffff;padding:20px 24px">
      <h1 style="margin:0;font-size:18px;color:#ffffff">📊 ${periodLabel}</h1>
      <p style="margin:4px 0 0;opacity:0.8;font-size:12px;color:#cccccc">Rikap.io অটো রিপোর্ট</p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 24px">
      <!-- Summary Cards -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" style="padding:4px">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border-radius:8px">
              <tr><td style="padding:12px 8px;text-align:center">
                <div style="font-size:22px;font-weight:bold;color:#2563eb">${totalOrders}</div>
                <div style="font-size:11px;color:#666">মোট অর্ডার</div>
              </td></tr>
            </table>
          </td>
          <td width="33%" style="padding:4px">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border-radius:8px">
              <tr><td style="padding:12px 8px;text-align:center">
                <div style="font-size:22px;font-weight:bold;color:#16a34a">${formatBDT(totalRevenue)}</div>
                <div style="font-size:11px;color:#666">মোট সেলস</div>
              </td></tr>
            </table>
          </td>
          <td width="34%" style="padding:4px">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:8px">
              <tr><td style="padding:12px 8px;text-align:center">
                <div style="font-size:22px;font-weight:bold;color:#d97706">${delivered}</div>
                <div style="font-size:11px;color:#666">ডেলিভার্ড</div>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>

      <h3 style="margin:18px 0 8px;font-size:14px;color:#1a1a2e">📦 অর্ডার স্ট্যাটাস</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">${statusRowsHtml}</table>

      <h3 style="margin:18px 0 8px;font-size:14px;color:#1a1a2e">💰 সেলস ব্রেকডাউন</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
        <tr><td style="padding:6px 10px;border-bottom:1px solid #eee">মোট সেলস</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${formatBDT(totalRevenue)}</td></tr>
        <tr><td style="padding:6px 10px;border-bottom:1px solid #eee">শিপিং ফি</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${formatBDT(totalShipping)}</td></tr>
        <tr><td style="padding:6px 10px;border-bottom:1px solid #eee">ডিসকাউন্ট</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;color:#dc2626">-${formatBDT(totalDiscount)}</td></tr>
        <tr><td style="padding:6px 10px;font-weight:bold">নেট রেভিনিউ</td><td style="padding:6px 10px;text-align:right;font-weight:bold;color:#16a34a">${formatBDT(totalRevenue - totalDiscount)}</td></tr>
      </table>

      <h3 style="margin:18px 0 8px;font-size:14px;color:#1a1a2e">🏆 টপ সেলিং প্রোডাক্ট</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
        <tr style="background:#f8f9fa"><td style="padding:8px 6px;font-weight:bold;font-size:11px">#</td><td style="padding:8px 6px;font-weight:bold;font-size:11px">প্রোডাক্ট</td><td style="padding:8px 6px;font-weight:bold;font-size:11px;text-align:center">পরিমাণ</td><td style="padding:8px 6px;font-weight:bold;font-size:11px;text-align:right">রেভিনিউ</td></tr>
        ${topProductRowsHtml || '<tr><td colspan="4" style="padding:12px;text-align:center;color:#999">কোন সেলস নেই</td></tr>'}
      </table>
    </td>
  </tr>
  <tr>
    <td style="background:#f8f9fa;padding:14px 24px;text-align:center;font-size:11px;color:#999">
      এই রিপোর্টটি অটোমেটিক জেনারেট হয়েছে — <a href="https://rikapio.shop" style="color:#2563eb;text-decoration:none">rikapio.shop</a>
    </td>
  </tr>
</table>
</body></html>`;

    // ── Send Email via Gmail SMTP (nodemailer) ──
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      });

      await transporter.sendMail({
        from: `"${brandName} Reports" <${GMAIL_USER}>`,
        to: adminEmail,
        subject: `📊 ${periodLabel} — ${brandName}`,
        html: emailHtml,
      });
      console.log("Email sent successfully");
    } catch (e) {
      console.error("Email error:", e);
    }

    return new Response(JSON.stringify({ success: true, report: periodLabel, orders: totalOrders, revenue: totalRevenue }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Report error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
