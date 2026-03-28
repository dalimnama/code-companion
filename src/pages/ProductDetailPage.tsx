import { useParams, Link } from 'react-router-dom';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { useProduct, useRelatedProducts } from '@/hooks/use-products';
import { useCartStore } from '@/stores/cart-store';
import { useLanguageStore } from '@/stores/language-store';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { formatBDT, calculateDiscount } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/ProductCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, ShoppingCart, Truck, Minus, Plus, ChevronRight, Shield, RotateCcw, Package, Ruler, ChevronLeft, Heart, Share2, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fbTrack, fbServerEvent } from '@/hooks/use-facebook-pixel';
import { trackEvent } from '@/lib/track-event';
import { useImageRatios } from '@/hooks/use-image-ratios';
import { useImageRadius } from '@/hooks/use-image-radius';
import { useWishlistStore } from '@/stores/wishlist-store';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductReviewsTab } from '@/components/ProductReviewsTab';
import { ImageLightbox } from '@/components/ImageLightbox';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PANT_SIZES = ['30', '32', '34', '36', '38'];

/* ─── Image Gallery ─── */
function ImageGallery({ images, title, ratio, borderRadius }: { images: string[]; title: string; ratio: string; borderRadius: string }) {
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const touchStartRef = useRef<number | null>(null);
  const touchDeltaRef = useRef(0);

  const goNext = () => { setDirection(1); setSelected((s) => (s + 1) % images.length); };
  const goPrev = () => { setDirection(-1); setSelected((s) => (s - 1 + images.length) % images.length); };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
    touchDeltaRef.current = 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    touchDeltaRef.current = e.touches[0].clientX - touchStartRef.current;
  };
  const handleTouchEnd = () => {
    if (touchStartRef.current === null) return;
    const delta = touchDeltaRef.current;
    if (delta < -50 && images.length > 1) goNext();
    else if (delta > 50 && images.length > 1) goPrev();
    touchStartRef.current = null;
    touchDeltaRef.current = 0;
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? '40%' : '-40%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-40%' : '40%', opacity: 0 }),
  };

  return (
    <div className="space-y-3 md:sticky md:top-24">
      {/* Main Image */}
      <div
        className="relative overflow-hidden bg-secondary/30 group"
        style={{ aspectRatio: ratio.replace('/', ' / '), borderRadius }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.img
            key={selected}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            src={images[selected]}
            alt={title}
            className="w-full h-full object-cover cursor-zoom-in absolute inset-0"
            onClick={() => setLightboxOpen(true)}
            draggable={false}
          />
        </AnimatePresence>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-background z-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-background z-10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Zoom button */}
        <button
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
          className="absolute bottom-3 right-3 bg-background/70 backdrop-blur-sm rounded-full p-2 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm z-10"
          aria-label="Zoom image"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        {/* Image counter */}
        <div className="absolute bottom-3 left-3 bg-background/70 backdrop-blur-sm rounded-full px-2.5 py-1 text-[10px] text-muted-foreground font-medium z-10">
          {selected + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > selected ? 1 : -1); setSelected(i); }}
              className={`shrink-0 w-[68px] h-[68px] rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                i === selected
                  ? 'border-primary ring-2 ring-primary/20 scale-105'
                  : 'border-border/40 opacity-60 hover:opacity-100 hover:border-primary/30'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox */}
      <ImageLightbox
        images={images}
        initialIndex={selected}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

/* ─── Rating Stars ─── */
function RatingStars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
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
      <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count} reviews)</span>
    </div>
  );
}

/* ─── Trust Badges ─── */
function TrustBadgesRow() {
  const badges = [
    { icon: Shield, label: 'Genuine Product', color: 'text-primary' },
    { icon: RotateCcw, label: 'Easy Return', color: 'text-primary' },
    { icon: Package, label: 'Secure Packing', color: 'text-primary' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {badges.map(({ icon: Icon, label, color }) => (
        <div key={label} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-secondary/50 text-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground leading-tight">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Size Selector ─── */
function SizeSelector({ sizes, sizeStock, selectedSize, onSelect, label }: {
  sizes: string[];
  sizeStock: Record<string, number>;
  selectedSize: string | null;
  onSelect: (size: string) => void;
  label: string;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        {selectedSize && (
          <span className="text-xs text-primary font-medium">Selected: {selectedSize}</span>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {sizes.map(size => {
          const stock = sizeStock[size] ?? 0;
          const isOut = stock <= 0;
          const isSelected = selectedSize === size;
          return (
            <button
              key={size}
              disabled={isOut}
              onClick={() => onSelect(size)}
              className={`relative w-12 h-12 rounded-xl text-sm font-bold transition-all duration-200 ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-2 border-primary shadow-md shadow-primary/20 scale-105'
                  : isOut
                    ? 'bg-muted text-muted-foreground/30 border border-border/20 cursor-not-allowed line-through'
                    : 'bg-card text-foreground border border-border hover:border-primary/50 hover:shadow-sm active:scale-95'
              }`}
            >
              {size}
              {isOut && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[1px] h-full bg-muted-foreground/20 rotate-45 absolute" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Size Chart Dialog ─── */
function SizeChartDialog({ type, open, onClose }: { type: string; open: boolean; onClose: () => void }) {
  const { data: charts } = useQuery({
    queryKey: ['size-charts', type],
    queryFn: async () => {
      const { data } = await supabase
        .from('size_charts')
        .select('*')
        .eq('type', type);
      return data || [];
    },
    enabled: open && !!type,
  });

  const chart = charts?.[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Size Charts</DialogTitle>
        </DialogHeader>
        {chart ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{chart.name}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted/50">
                    {(chart.columns as string[])?.map((col: string, i: number) => (
                      <th key={i} className="p-3 text-left font-bold border-b">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(chart.rows as Record<string, string>[])?.map((row: Record<string, string>, ri: number) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-secondary/20' : ''}>
                      {(chart.columns as string[])?.map((col: string, ci: number) => (
                        <td key={ci} className="p-3 border-b border-border/30">{row[col] || ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">কোনো সাইজ চার্ট পাওয়া যায়নি</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ─── */
export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || '');
  const { data: related } = useRelatedProducts(product?.category_id ?? null, product?.id ?? '');
  const { data: siteSettings } = useSiteSettings();
  const addItem = useCartStore((s) => s.addItem);
  const { t } = useLanguageStore();
  const { productDetail, toCSS } = useImageRatios();
  const radius = useImageRadius();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');

  const hasSizes = product?.has_sizes ?? false;
  const sizeStock = (product?.size_stock as Record<string, number>) || {};
  const hasPantSizes = (product as any)?.has_pant_sizes ?? false;
  const pantSizeStock = ((product as any)?.pant_size_stock as Record<string, number>) || {};
  const hasSizeChart = product?.has_size_chart ?? false;
  const sizeChartType = product?.size_chart_type || 'shirt';

  const hasAnySizes = hasSizes || hasPantSizes;
  const activeSizeStock = hasSizes ? sizeStock : pantSizeStock;

  // ViewContent tracking
  useEffect(() => {
    if (product) {
      const params = {
        content_ids: [product.id],
        content_name: product.title,
        content_type: 'product',
        value: product.price,
        currency: 'BDT',
      };
      fbTrack('ViewContent', params);
      fbServerEvent('ViewContent', params);
      trackEvent({
        event_type: 'view_product',
        product_id: product.id,
        product_title: product.title,
        product_price: product.price,
      });
    }
  }, [product?.id]);

  const currentStock = hasAnySizes && selectedSize
    ? (activeSizeStock[selectedSize] ?? 0)
    : (product?.stock ?? 0);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    if (hasAnySizes && !selectedSize) {
      toast.error('সাইজ সিলেক্ট করুন');
      return;
    }
    const images = product.images?.length ? product.images : ['/placeholder.svg'];
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
    toast.success(`${product.title}${selectedSize ? ` (${selectedSize})` : ''} added to cart`);
    
    const params = {
      content_ids: [product.id],
      content_name: product.title,
      content_type: 'product',
      value: product.price * qty,
      currency: 'BDT',
      num_items: qty,
    };
    fbTrack('AddToCart', params);
    fbServerEvent('AddToCart', params);
    trackEvent({
      event_type: 'add_to_cart',
      product_id: product.id,
      product_title: product.title,
      product_price: product.price,
      product_size: selectedSize || undefined,
      quantity: qty,
    });
  }, [product, qty, addItem, hasAnySizes, selectedSize, currentStock]);

  const handleBuyNow = useCallback(() => {
    if (hasAnySizes && !selectedSize) {
      toast.error('সাইজ সিলেক্ট করুন');
      return;
    }
    handleAddToCart();
    navigate('/checkout');
  }, [handleAddToCart, navigate, hasAnySizes, selectedSize]);

  if (isLoading) {
    return (
      <ShopLayout>
        <div className="container-shop py-6">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[3/4] rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </ShopLayout>
    );
  }

  if (!product) {
    return (
      <ShopLayout>
        <div className="container-shop py-20 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
        </div>
      </ShopLayout>
    );
  }

  const discount = calculateDiscount(product.price, product.compare_at_price);
  const images = product.images?.length ? product.images : ['/placeholder.svg'];
  const specs = (product.specifications as Record<string, string>) || {};
  const hasRating = (product.rating_avg ?? 0) > 0;

  const totalStock = hasAnySizes
    ? Object.values(activeSizeStock).reduce((s, v) => s + (v || 0), 0)
    : product.stock;

  return (
    <ShopLayout>
      <div className="container-shop py-4 sm:py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs text-muted-foreground mb-5 sm:mb-6">
          <Link to="/" className="hover:text-primary transition-colors">{t('home')}</Link>
          <ChevronRight className="h-3 w-3 mx-1.5 text-muted-foreground/50" />
          <span className="text-foreground font-medium truncate max-w-[220px]">{product.title}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-6 md:gap-10 lg:gap-14">
          {/* Image Gallery */}
          <ImageGallery images={images} title={product.title} ratio={productDetail} borderRadius={radius.productDetail} />

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="space-y-5"
          >
            {/* Title & Short Description */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold leading-tight tracking-tight">{product.title}</h1>
              {product.short_description && (
                <p className="text-muted-foreground text-sm leading-relaxed">{product.short_description}</p>
              )}
            </div>

            {hasRating && (
              <RatingStars rating={product.rating_avg ?? 0} count={product.rating_count ?? 0} />
            )}

            {/* Price Block */}
            <div className="bg-secondary/40 rounded-2xl p-4 space-y-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">{formatBDT(product.price)}</span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <>
                    <span className="text-base text-muted-foreground/70 line-through font-medium">
                      {formatBDT(product.compare_at_price)}
                    </span>
                    <Badge className="bg-sale text-sale-foreground font-bold text-xs px-2.5 py-0.5 rounded-full shadow-sm">
                      -{discount}%
                    </Badge>
                  </>
                )}
              </div>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <p className="text-xs text-primary font-medium">
                  You save {formatBDT(product.compare_at_price - product.price)}
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {totalStock > 0 ? (
                <div className="inline-flex items-center gap-2 bg-success/10 text-success px-3.5 py-2 rounded-full text-sm font-semibold">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  {totalStock <= 10 ? t('onlyLeft').replace('{count}', String(totalStock)) : t('inStock')}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-sale/10 text-sale px-3.5 py-2 rounded-full text-sm font-semibold">
                  <div className="w-2 h-2 rounded-full bg-sale" />
                  {t('outOfStock')}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Size Selector */}
            {hasAnySizes && (
              <div className="space-y-3">
                <SizeSelector
                  sizes={hasSizes ? SIZES : PANT_SIZES}
                  sizeStock={activeSizeStock}
                  selectedSize={selectedSize}
                  onSelect={s => { setSelectedSize(s); setQty(1); }}
                  label={hasSizes ? 'Size' : 'Pant-Size'}
                />
                {hasSizeChart && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary font-semibold text-xs gap-1.5 px-0"
                    onClick={() => setSizeChartOpen(true)}
                  >
                    <Ruler className="h-3.5 w-3.5" />
                    View Size Chart
                  </Button>
                )}
              </div>
            )}

            {!hasAnySizes && hasSizeChart && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary font-semibold text-xs gap-1.5 px-0"
                onClick={() => setSizeChartOpen(true)}
              >
                <Ruler className="h-3.5 w-3.5" />
                View Size Chart
              </Button>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-muted-foreground">{t('quantity')}:</span>
              <div className="flex items-center bg-secondary/60 rounded-xl border border-border/50">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-l-xl rounded-r-none hover:bg-secondary"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-12 text-center font-bold text-base select-none border-x border-border/30">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-r-xl rounded-l-none hover:bg-secondary"
                  onClick={() => setQty(Math.min(currentStock, qty + 1))}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-1">
              <Button
                className="w-full h-[52px] text-base font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 gap-2"
                size="lg"
                onClick={handleBuyNow}
                disabled={totalStock <= 0 || (hasAnySizes && currentStock <= 0)}
              >
                {t('buyNow')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full h-[52px] text-base font-bold rounded-2xl border-2 hover:bg-secondary/80 transition-all duration-300 gap-2"
                onClick={handleAddToCart}
                disabled={totalStock <= 0 || (hasAnySizes && currentStock <= 0)}
              >
                <ShoppingCart className="h-5 w-5" />
                {t('addToCart')}
              </Button>
            </div>

            {/* Trust Badges */}
            <TrustBadgesRow />

            {/* Delivery Card */}
            <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="font-bold text-sm">{t('deliveryEstimate')}</span>
                  <p className="text-[11px] text-muted-foreground">Cash on Delivery Available</p>
                </div>
              </div>
              <div className="space-y-2 pl-[52px]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('insideDhaka')}: 2-3 days (৳{siteSettings?.shipping_cost_inside_dhaka || '60'})</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('outsideDhaka')}: 4-7 days (৳{siteSettings?.shipping_cost_outside_dhaka || '120'})</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Description, Specifications & Reviews Tabs */}
        <div className="mt-10 sm:mt-14">
          <div className="flex bg-secondary/50 rounded-2xl p-1 w-full overflow-hidden">
            {(['description', 'specifications', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 text-center whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'description' ? t('description') : tab === 'specifications' ? t('specifications') : 'Reviews'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-4"
            >
              {activeTab === 'description' ? (
                <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-7 shadow-sm">
                  <p className="text-muted-foreground leading-7 text-sm sm:text-[15px] whitespace-pre-line">{product.description}</p>
                </div>
              ) : activeTab === 'specifications' ? (
                Object.keys(specs).length > 0 ? (
                  <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                    {Object.entries(specs).map(([key, value], i) => (
                      <div
                        key={key}
                        className={`flex items-center ${i % 2 === 0 ? 'bg-secondary/20' : ''} ${
                          i !== Object.entries(specs).length - 1 ? 'border-b border-border/30' : ''
                        }`}
                      >
                        <div className="w-2/5 sm:w-1/3 p-4 font-semibold text-sm">{key}</div>
                        <div className="w-3/5 sm:w-2/3 p-4 text-sm text-muted-foreground">{value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-card border border-border/50 rounded-2xl p-8 text-center shadow-sm">
                    <p className="text-muted-foreground text-sm">No specifications available.</p>
                  </div>
                )
              ) : (
                <ProductReviewsTab productId={product.id} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Related Products */}
        {related && related.length > 0 && (
          <section className="mt-12 sm:mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold">{t('relatedProducts')}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Size Chart Dialog */}
      {hasSizeChart && (
        <SizeChartDialog type={sizeChartType} open={sizeChartOpen} onClose={() => setSizeChartOpen(false)} />
      )}
    </ShopLayout>
  );
}
