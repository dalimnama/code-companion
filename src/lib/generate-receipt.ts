import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';

// ─── Preload & cache logo once ───
let cachedLogoData: { base64: string; aspectRatio: number } | null = null;
let logoLoadPromise: Promise<typeof cachedLogoData> | null = null;

async function getLogoUrl(): Promise<string> {
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['logo_type', 'logo_image_url'])
      .limit(2);
    const map: Record<string, string> = {};
    data?.forEach(r => { map[r.key] = r.value; });
    if (map.logo_type === 'image' && map.logo_image_url) {
      return map.logo_image_url;
    }
  } catch { /* fall through */ }
  return '';
}

function loadLogoFromUrl(url: string): Promise<typeof cachedLogoData> {
  return new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(400 / img.naturalWidth, 1);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      cachedLogoData = {
        base64: canvas.toDataURL('image/png'),
        aspectRatio: img.naturalWidth / img.naturalHeight,
      };
      resolve(cachedLogoData);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function preloadLogo(): Promise<typeof cachedLogoData> {
  if (cachedLogoData) return cachedLogoData;
  if (logoLoadPromise) return logoLoadPromise;
  logoLoadPromise = (async () => {
    const logoUrl = await getLogoUrl();
    return loadLogoFromUrl(logoUrl);
  })();
  return logoLoadPromise;
}

export async function generateReceiptPDF(order: any, siteSettings?: Record<string, string>) {
  // Reset cache to pick up latest logo
  cachedLogoData = null;
  logoLoadPromise = null;

  // Dynamic settings with fallbacks
  const brandName = siteSettings?.logo_text || 'rikapio';
  const brandPhone = siteSettings?.phone || '01840469120';
  const brandEmail = siteSettings?.email || 'rikapioshop@gmail.com';
  const brandAddress = siteSettings?.address || 'Dhaka, Bangladesh';
  const brandDomain = siteSettings?.domain || 'rikapio.shop';
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 16; // margin

  // ─── Background accent ───
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pw, 6, 'F');

  // ─── Logo / Brand (use cached logo) ───
  const logoY = 12;
  const maxLogoH = 28;

  const logoData = await preloadLogo();
  if (logoData) {
    const logoW = maxLogoH * logoData.aspectRatio;
    doc.addImage(logoData.base64, 'PNG', m, logoY, logoW, maxLogoH);
  } else {
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(brandName, m, logoY + 16);
  }

  // ─── Invoice title ───
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pw - m, 26, { align: 'right' });

  // Invoice meta
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text(`Invoice No: #${order.order_id}`, pw - m, 38, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' })}`, pw - m, 44, { align: 'right' });

  // ─── Thin separator ───
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  const sepY = logoY + maxLogoH + 14;
  doc.line(m, sepY, pw - m, sepY);

  // ─── Bill To / From Cards ───
  const cardW = (pw - m * 2 - 8) / 2;
  const cardY = sepY + 10;
  const cardH = 42;

  // Bill To card
  doc.setFillColor(243, 244, 246); // gray-100
  doc.roundedRect(m, cardY, cardW, cardH, 3, 3, 'F');
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(m, cardY, cardW, 7, 3, 3, 'F');
  doc.rect(m, cardY + 4, cardW, 3, 'F'); // cover bottom radius
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', m + 5, cardY + 5.2);

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(order.customer_name, m + 5, cardY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text(order.customer_phone, m + 5, cardY + 22);
  const addr = `${order.address}, ${order.area}, ${order.city}`;
  const addrLines = doc.splitTextToSize(addr, cardW - 10);
  doc.text(addrLines, m + 5, cardY + 29);

  // From card
  const fromX = m + cardW + 8;
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(fromX, cardY, cardW, cardH, 3, 3, 'F');
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(fromX, cardY, cardW, 7, 3, 3, 'F');
  doc.rect(fromX, cardY + 4, cardW, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', fromX + 5, cardY + 5.2);

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(brandName, fromX + 5, cardY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.text(brandAddress, fromX + 5, cardY + 22);
  doc.text(brandPhone, fromX + 5, cardY + 29);
  doc.text(brandEmail, fromX + 5, cardY + 35);

  // ─── Items Table ───
  const items = order.items || [];
  const tableBody = items.map((item: any, i: number) => [
    String(i + 1).padStart(2, '0'),
    item.title,
    item.quantity.toString(),
    `BDT ${item.price.toFixed(2)}`,
    `BDT ${(item.price * item.quantity).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: cardY + cardH + 8,
    head: [['#', 'Product', 'Qty', 'Unit Price', 'Amount']],
    body: tableBody,
    theme: 'plain',
    headStyles: {
      fillColor: [16, 185, 129],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [55, 65, 81],
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 68 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: m, right: m },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.2,
  });

  // ─── Totals Section ───
  const finalY = (doc as any).lastAutoTable?.finalY || 140;
  let y = finalY + 10;
  const labelX = pw - m - 80;
  const valX = pw - m;

  const drawRow = (label: string, value: string, bold = false, color?: number[]) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...(color || [107, 114, 128]) as [number, number, number]);
    doc.text(label, labelX, y);
    doc.setTextColor(...(color || (bold ? [31, 41, 55] : [107, 114, 128])) as [number, number, number]);
    doc.text(value, valX, y, { align: 'right' });
    y += 7;
  };

  drawRow('Subtotal', `BDT ${order.subtotal.toFixed(2)}`);
  drawRow('Delivery', `BDT ${order.shipping_cost.toFixed(2)}`);
  if (order.discount_amount > 0) {
    drawRow('Discount', `-BDT ${order.discount_amount.toFixed(2)}`, false, [239, 68, 68]);
  }

  // Grand total highlight
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(labelX - 4, y - 4, valX - labelX + 8, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total', labelX, y + 3);
  doc.text(`BDT ${order.total.toFixed(2)}`, valX, y + 3, { align: 'right' });
  y += 16;

  drawRow('Paid', order.payment_method !== 'cod' ? `BDT ${order.total.toFixed(2)}` : 'BDT 0.00');
  if (order.payment_method === 'cod') {
    drawRow('Due', `BDT ${order.total.toFixed(2)}`, true, [239, 68, 68]);
  } else {
    drawRow('Due', 'BDT 0.00');
  }

  // ─── Footer ───
  const footerY = Math.max(y + 12, ph - 30);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(m, footerY, pw - m, footerY);

  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text('Thank you for your purchase!', pw / 2, footerY + 8, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text(`${brandPhone}  •  ${brandEmail}  •  ${brandDomain}`, pw / 2, footerY + 14, { align: 'center' });

  // Bottom accent bar
  doc.setFillColor(16, 185, 129);
  doc.rect(0, ph - 4, pw, 4, 'F');

  doc.save(`Invoice-${order.order_id}.pdf`);
}
