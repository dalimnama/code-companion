import { useSiteSettings } from './use-site-settings';

function ratioToPercent(ratio: string): string {
  const parts = ratio.split('/');
  if (parts.length !== 2) return '100%';
  const w = parseFloat(parts[0]);
  const h = parseFloat(parts[1]);
  if (!w || !h) return '100%';
  return `${(h / w) * 100}%`;
}

function ratioToCSS(ratio: string): string {
  return ratio.replace('/', ' / ');
}

export function useImageRatios() {
  const { data: settings } = useSiteSettings();

  return {
    bannerMobile: settings?.banner_ratio_mobile || '16/7',
    bannerDesktop: settings?.banner_ratio_desktop || '21/8',
    categoryImage: settings?.category_image_ratio || '4/5',
    productCard: settings?.product_card_ratio || '1/1',
    productDetail: settings?.product_detail_ratio || '1/1',
    // Helper to convert "16/7" → "16 / 7" for CSS aspect-ratio
    toCSS: ratioToCSS,
    // Helper to convert "16/7" → "43.75%" for padding-bottom fallback
    toPercent: ratioToPercent,
  };
}
