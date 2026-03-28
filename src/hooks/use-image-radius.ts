import { useSiteSettings } from './use-site-settings';

export function useImageRadius() {
  const { data: settings } = useSiteSettings();

  return {
    banner: `${settings?.banner_radius || '16'}px`,
    category: `${settings?.category_image_radius || '16'}px`,
    productCard: `${settings?.product_card_radius || '16'}px`,
    productDetail: `${settings?.product_detail_radius || '16'}px`,
  };
}
