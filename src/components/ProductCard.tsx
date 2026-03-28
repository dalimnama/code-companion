import { Link } from 'react-router-dom';
import { optimizeImageUrl, generateSrcSet } from '@/lib/image-utils';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguageStore } from '@/stores/language-store';
import { formatBDT, calculateDiscount } from '@/lib/format';
import { useState, useCallback } from 'react';
import { useImageRatios } from '@/hooks/use-image-ratios';
import { useImageRadius } from '@/hooks/use-image-radius';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { useWishlistStore } from '@/stores/wishlist-store';
import { QuickViewModal } from '@/components/QuickViewModal';
import type { Product } from '@/hooks/use-products';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useLanguageStore();
  const { productCard, toCSS } = useImageRatios();
  const radius = useImageRadius();
  const { data: siteSettings } = useSiteSettings();
  const wishlistToggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.items.includes(product.id));
  const discount = calculateDiscount(product.price, product.compare_at_price);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const btnHeight = siteSettings?.order_btn_height || '40';
  const btnBorderWidth = siteSettings?.order_btn_border_width || '2';
  const btnBorderRadius = siteSettings?.order_btn_border_radius || '8';
  const btnFontSize = siteSettings?.order_btn_font_size || '14';
  const btnBorderColor = siteSettings?.order_btn_border_color || 'foreground';

  const handleOrderNow = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;
    setQuickViewOpen(true);
  }, [product.stock]);

  const handlePrefetch = useCallback(() => {
    import('@/pages/ProductDetailPage').catch(() => {});
  }, []);

  return (
    <>
      <Link
        to={`/p/${product.slug}`}
        className="block h-full"
        onMouseEnter={handlePrefetch}
        onTouchStart={handlePrefetch}
      >
        <div className="group relative overflow-hidden border border-border/40 bg-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 h-full flex flex-col active:scale-[0.97]" style={{ borderRadius: radius.productCard }}>
          {/* Image */}
          <div className="relative overflow-hidden bg-secondary/30" style={{ aspectRatio: toCSS(productCard) }}>
            <img
              src={optimizeImageUrl(product.images?.[0] || '/placeholder.svg', 400)}
              srcSet={generateSrcSet(product.images?.[0] || '', [230, 400, 600])}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 230px"
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              decoding="async"
            />
            
            {/* Badges */}
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
              {discount > 0 && (
                <Badge className="bg-sale text-sale-foreground border-0 text-[10px] font-bold px-2.5 py-0.5 shadow-lg rounded-lg">
                  -{discount}%
                </Badge>
              )}
              {product.is_new && (
                <Badge className="bg-primary text-primary-foreground border-0 text-[10px] font-bold px-2.5 py-0.5 shadow-lg rounded-lg">
                  NEW
                </Badge>
              )}
            </div>

            {/* Quick action - Wishlist */}
            <div className={`absolute top-2.5 right-2.5 transition-all duration-300 ${isWishlisted ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'}`}>
              <button
                className="w-9 h-9 rounded-xl bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-background transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); wishlistToggle(product.id); }}
              >
                <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-sale text-sale' : 'text-muted-foreground hover:text-sale'}`} />
              </button>
            </div>

            {/* Out of stock overlay */}
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
                <span className="font-bold text-sm text-muted-foreground bg-background/80 px-3 py-1 rounded-full">{t('outOfStock')}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 flex flex-col flex-1 gap-1.5">
            <h3 className="font-medium text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
              {product.title}
            </h3>
            
            {/* Rating */}
            {(product.rating_avg ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <span className="text-xs font-semibold">{(product.rating_avg ?? 0).toFixed(1)}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">({product.rating_count})</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="font-bold text-base sm:text-lg text-foreground">{formatBDT(product.price)}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-[11px] text-muted-foreground line-through">
                  {formatBDT(product.compare_at_price)}
                </span>
              )}
            </div>

            {/* Order Now - outlined style like reference */}
            <button
              className="w-full inline-flex items-center justify-center gap-1.5 font-semibold bg-transparent hover:bg-foreground hover:text-background transition-all disabled:opacity-50 disabled:pointer-events-none mt-1.5"
              style={{
                height: `${btnHeight}px`,
                borderWidth: `${btnBorderWidth}px`,
                borderStyle: 'solid',
                borderColor: `hsl(var(--${btnBorderColor}))`,
                borderRadius: `${btnBorderRadius}px`,
                fontSize: `${btnFontSize}px`,
              }}
              onClick={handleOrderNow}
              disabled={product.stock <= 0}
            >
              <ShoppingCart style={{ width: `${btnFontSize}px`, height: `${btnFontSize}px` }} />
              {t('orderNow')}
            </button>
          </div>
        </div>
      </Link>

      {/* Quick View Modal */}
      {quickViewOpen && (
        <QuickViewModal
          product={product}
          open={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </>
  );
}
