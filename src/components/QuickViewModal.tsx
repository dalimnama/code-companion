import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart-store';
import { useLanguageStore } from '@/stores/language-store';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { formatBDT, calculateDiscount } from '@/lib/format';
import { ShoppingCart, Minus, Plus, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/hooks/use-products';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PANT_SIZES = ['30', '32', '34', '36', '38'];

interface QuickViewModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, open, onClose }: QuickViewModalProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { t } = useLanguageStore();
  const { data: siteSettings } = useSiteSettings();
  const navigate = useNavigate();

  const qvMaxWidth = siteSettings?.quickview_max_width || '92';
  const qvMaxHeight = siteSettings?.quickview_max_height || '85';
  const qvImageRatio = siteSettings?.quickview_image_ratio || '3/4';
  const qvBorderRadius = siteSettings?.quickview_border_radius || '16';
  const qvImageRadius = siteSettings?.quickview_image_radius || '12';
  const closeSize = siteSettings?.quickview_close_size || '32';
  const closeIconSize = siteSettings?.quickview_close_icon_size || '16';
  const closeBorderWidth = siteSettings?.quickview_close_border_width || '1';
  const closeBorderRadius = siteSettings?.quickview_close_border_radius || '50';
  const closeOpacity = Number(siteSettings?.quickview_close_opacity || '80') / 100;
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(false);

  const images = product.images?.length ? product.images : ['/placeholder.svg'];
  const discount = calculateDiscount(product.price, product.compare_at_price);
  const hasSizes = product.has_sizes ?? false;
  const sizeStock = (product.size_stock as Record<string, number>) || {};
  const hasPantSizes = (product as any)?.has_pant_sizes ?? false;
  const pantSizeStock = ((product as any)?.pant_size_stock as Record<string, number>) || {};
  const hasAnySizes = hasSizes || hasPantSizes;
  const activeSizeStock = hasSizes ? sizeStock : pantSizeStock;
  const activeSizes = hasSizes ? SIZES : PANT_SIZES;
  const specs = (product.specifications as Record<string, string>) || {};

  const currentStock = hasAnySizes && selectedSize
    ? (activeSizeStock[selectedSize] ?? 0)
    : (product.stock ?? 0);

  const totalStock = hasAnySizes
    ? Object.values(activeSizeStock).reduce((s, v) => s + (v || 0), 0)
    : product.stock;

  const handleAddToCart = useCallback(() => {
    if (hasAnySizes && !selectedSize) {
      toast.error('সাইজ সিলেক্ট করুন');
      return;
    }
    for (let i = 0; i < qty; i++) {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        compareAtPrice: product.compare_at_price,
        image: images[0],
        slug: product.slug,
        stock: currentStock,
        size: selectedSize || undefined,
      });
    }
    toast.success(`${product.title}${selectedSize ? ` (${selectedSize})` : ''} কার্টে যোগ হয়েছে`);
  }, [product, qty, addItem, hasAnySizes, selectedSize, currentStock, images]);

  const handleBuyNow = useCallback(() => {
    if (hasAnySizes && !selectedSize) {
      toast.error('সাইজ সিলেক্ট করুন');
      return;
    }
    handleAddToCart();
    onClose();
    navigate('/checkout');
  }, [handleAddToCart, navigate, onClose, hasAnySizes, selectedSize]);

  const handleViewDetails = () => {
    onClose();
    navigate(`/p/${product.slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="qv-dialog p-0 border-0 shadow-2xl overflow-hidden gap-0"
        style={{
          maxWidth: `${qvMaxWidth}vw`,
          maxHeight: `${qvMaxHeight}vh`,
          borderRadius: `${qvBorderRadius}px`,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex items-center justify-center bg-background backdrop-blur-sm shadow-md border border-border/50 hover:bg-accent transition-colors"
          style={{
            width: `${closeSize}px`,
            height: `${closeSize}px`,
            borderWidth: `${closeBorderWidth}px`,
            borderRadius: `${closeBorderRadius}%`,
            opacity: closeOpacity,
          }}
        >
          <X style={{ width: `${closeIconSize}px`, height: `${closeIconSize}px` }} />
        </button>

        <div className="overflow-y-auto px-4 py-5 space-y-4" style={{ maxHeight: `${qvMaxHeight}vh` }}>
          {/* Image Gallery */}
          <div className="relative overflow-hidden bg-secondary/30 mx-auto w-full" style={{ borderRadius: `${qvImageRadius}px` }}>
            <div style={{ aspectRatio: '3 / 4' }}>
              <img
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
            {discount > 0 && (
              <Badge className="absolute top-3 left-3 bg-sale text-sale-foreground border-0 text-xs font-bold px-3 py-1 shadow-lg">
                -{discount}%
              </Badge>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="relative flex items-center gap-2">
              {images.length > 3 && (
                <button
                  onClick={() => setSelectedImage(Math.max(0, selectedImage - 1))}
                  className="shrink-0 w-8 h-8 rounded-full bg-background shadow-md border border-border/50 flex items-center justify-center hover:bg-accent transition-colors"
                  disabled={selectedImage === 0}
                >
                  <ChevronDown className="h-4 w-4 -rotate-90" />
                </button>
              )}
              <div className="flex gap-2 overflow-x-auto flex-1 py-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-[72px] h-[90px] rounded-lg overflow-hidden border-2 transition-all ${
                      i === selectedImage
                        ? 'border-primary shadow-md'
                        : 'border-border/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
              {images.length > 3 && (
                <button
                  onClick={() => setSelectedImage(Math.min(images.length - 1, selectedImage + 1))}
                  className="shrink-0 w-8 h-8 rounded-full bg-background shadow-md border border-border/50 flex items-center justify-center hover:bg-accent transition-colors"
                  disabled={selectedImage === images.length - 1}
                >
                  <ChevronDown className="h-4 w-4 rotate-90" />
                </button>
              )}
            </div>
          )}

          {/* Title & Description */}
          <div>
            <h2 className="text-xl font-bold leading-snug">{product.title}</h2>
            {product.short_description && (
              <p className="text-sm text-muted-foreground mt-1">{product.short_description}</p>
            )}
          </div>

          {/* Rating */}
          {(product.rating_avg ?? 0) > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const rating = product.rating_avg ?? 0;
                  const filled = star <= Math.floor(rating);
                  const partial = !filled && star === Math.ceil(rating) && rating % 1 > 0;
                  return (
                    <div key={star} className="relative">
                      <Star className="h-4 w-4 text-muted-foreground/20" />
                      {(filled || partial) && (
                        <Star
                          className="h-4 w-4 fill-warning text-warning absolute inset-0"
                          style={partial ? { clipPath: `inset(0 ${(1 - (rating % 1)) * 100}% 0 0)` } : undefined}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="text-sm font-medium">{(product.rating_avg ?? 0).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({product.rating_count} reviews)</span>
            </div>
          )}

          {/* Price Block */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-extrabold tracking-tight">{formatBDT(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <>
                <span className="text-base text-muted-foreground line-through">
                  {formatBDT(product.compare_at_price)}
                </span>
                <Badge className="bg-sale/10 text-sale border border-sale/20 font-semibold text-xs px-2 py-0.5">
                  Save {discount}%
                </Badge>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div>
            {totalStock > 0 ? (
              <div className="inline-flex items-center gap-1.5 bg-success/10 text-success px-3 py-1.5 rounded-full text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {totalStock <= 10 ? `মাত্র ${totalStock}টি বাকি` : t('inStock')}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-sale/10 text-sale px-3 py-1.5 rounded-full text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-sale" />
                {t('outOfStock')}
              </div>
            )}
          </div>

          {/* Size Selector */}
          {hasAnySizes && (
            <div className="space-y-2">
              <span className="text-sm font-medium">{hasSizes ? 'Size' : 'Pant Size'}</span>
              <div className="grid grid-cols-5 gap-2">
                {activeSizes.map(size => {
                  const stock = activeSizeStock[size] ?? 0;
                  const isOut = stock <= 0;
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      disabled={isOut}
                      onClick={() => { setSelectedSize(size); setQty(1); }}
                      className={`h-11 rounded-xl border-2 text-sm font-semibold transition-all ${
                        isSelected
                          ? 'bg-foreground text-background border-foreground shadow-lg'
                          : isOut
                            ? 'bg-muted text-muted-foreground/40 border-border/30 cursor-not-allowed line-through'
                            : 'bg-card text-foreground border-border hover:border-foreground/50'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">{t('quantity')}:</span>
            <div className="flex items-center bg-secondary rounded-xl overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none"
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-semibold select-none">{qty}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none"
                onClick={() => setQty(Math.min(currentStock, qty + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1">
            <Button
              className="flex-1 h-12 font-semibold rounded-xl shadow-lg shadow-primary/20"
              onClick={handleBuyNow}
              disabled={totalStock <= 0 || (hasAnySizes && !selectedSize)}
            >
              {t('buyNow')}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 font-semibold rounded-xl border-2"
              onClick={handleAddToCart}
              disabled={totalStock <= 0 || (hasAnySizes && !selectedSize)}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {t('addToCart')}
            </Button>
          </div>


          {/* Collapsible Description & Specs */}
          {(product.description || Object.keys(specs).length > 0) && (
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="w-full flex items-center justify-between p-4 text-sm font-semibold hover:bg-secondary/30 transition-colors"
              >
                <span>{t('description')} ও বিস্তারিত</span>
                {showDescription ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {showDescription && (
                <div className="px-4 pb-4 space-y-4">
                  {product.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                  )}
                  {Object.keys(specs).length > 0 && (
                    <div className="border border-border/40 rounded-xl overflow-hidden">
                      {Object.entries(specs).map(([key, value], i) => (
                        <div
                          key={key}
                          className={`flex items-center ${i % 2 === 0 ? 'bg-secondary/30' : ''} ${
                            i !== Object.entries(specs).length - 1 ? 'border-b border-border/40' : ''
                          }`}
                        >
                          <div className="w-2/5 p-3 font-medium text-xs">{key}</div>
                          <div className="w-3/5 p-3 text-xs text-muted-foreground">{value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* View Full Details Link */}
          <button
            onClick={handleViewDetails}
            className="w-full text-center text-sm text-primary font-medium hover:underline py-2"
          >
            সম্পূর্ণ বিস্তারিত দেখুন →
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
