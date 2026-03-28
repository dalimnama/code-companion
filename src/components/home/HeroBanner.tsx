import { useState, useEffect, useCallback, useRef } from 'react';
import { useBanners } from '@/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { optimizeImageUrl } from '@/lib/image-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useImageRatios } from '@/hooks/use-image-ratios';
import { useImageRadius } from '@/hooks/use-image-radius';
import { useSiteSettings } from '@/hooks/use-site-settings';

export function HeroBanner() {
  const { data: banners, isLoading } = useBanners();
  const { data: siteSettings } = useSiteSettings();
  const showProgressBar = siteSettings?.banner_progress_bar !== 'false';
  const overlayOpacity = parseInt(siteSettings?.banner_overlay_opacity || '60', 10);
  const { bannerMobile, bannerDesktop, toCSS } = useImageRatios();
  const radius = useImageRadius();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goTo = useCallback((index: number) => {
    if (!banners?.length) return;
    setHasInteracted(true);
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current, banners?.length]);

  const goNext = useCallback(() => {
    if (!banners?.length) return;
    setHasInteracted(true);
    setDirection(1);
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners?.length]);

  const goPrev = useCallback(() => {
    if (!banners?.length) return;
    setHasInteracted(true);
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners?.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  }, [goNext, goPrev]);

  useEffect(() => {
    if (!banners?.length) return;
    const interval = setInterval(goNext, 5000);
    return () => clearInterval(interval);
  }, [banners?.length, goNext]);

  if (isLoading) {
    return (
      <div className="w-full overflow-hidden"
        style={{ aspectRatio: toCSS(bannerMobile), borderRadius: radius.banner }}
      >
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!banners?.length) return null;

  const banner = banners[current];
  const isFirstRender = current === 0 && !hasInteracted;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-30%' : '30%',
      opacity: 0,
      transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
    }),
  };

  const renderImage = (imgBanner: typeof banner, eager: boolean) => (
    <img
      src={optimizeImageUrl(imgBanner.image, 1200)}
      alt={imgBanner.title}
      className="w-full h-full object-cover"
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding={eager ? 'sync' : 'async'}
    />
  );

  return (
    <div className="relative w-full group">
      <style>{`
        .hero-banner-aspect { aspect-ratio: ${toCSS(bannerMobile)}; }
        @media (min-width: 768px) { .hero-banner-aspect { aspect-ratio: ${toCSS(bannerDesktop)}; max-height: 420px; } }
        @media (min-width: 1280px) { .hero-banner-aspect { max-height: 400px; } }
      `}</style>
      {/* Main banner */}
      <div
        className="hero-banner-aspect relative w-full overflow-hidden bg-foreground/5 shadow-2xl touch-pan-y"
        style={{ borderRadius: radius.banner }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* First slide rendered directly (no animation) for instant LCP */}
        {isFirstRender ? (
          <div className="absolute inset-0">
            {banner.link ? (
              <Link to={banner.link} className="block w-full h-full">
                {renderImage(banner, true)}
              </Link>
            ) : (
              renderImage(banner, true)
            )}
          </div>
        ) : (
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
            >
              {banner.link ? (
                <Link to={banner.link} className="block w-full h-full">
                  {renderImage(banner, false)}
                </Link>
              ) : (
                renderImage(banner, false)
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Gradient overlays */}
        <div
          className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent pointer-events-none"
          style={{ background: `linear-gradient(to top, rgba(0,0,0,${overlayOpacity / 100}), transparent 60%, transparent)` }}
        />

        {/* Title overlay */}
        <div className="absolute inset-0 flex items-end pointer-events-none">
          <div className="container-shop pb-10 md:pb-14">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <h2 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="text-xs sm:text-sm md:text-base text-white/70 mt-1 max-w-xs md:max-w-md">
                    {banner.subtitle}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress bar + dots */}
        <div className="absolute bottom-0 left-0 right-0">
          {/* Auto-play progress */}
          {showProgressBar && (
            <div className="h-[2px] bg-white/10">
              <motion.div
                key={current}
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            </div>
          )}
          <div className="flex items-center justify-center py-2.5 md:py-4 gap-1.5 md:gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  'rounded-full transition-all duration-500',
                  i === current
                    ? 'w-7 md:w-9 h-2 md:h-2.5 bg-primary shadow-md shadow-primary/40'
                    : 'w-2 md:w-2.5 h-2 md:h-2.5 bg-white/25 hover:bg-white/50'
                )}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
