import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Phone, ShoppingCart, User, Plus } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCategories } from '@/hooks/use-products';
import { useLanguageStore } from '@/stores/language-store';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { useState, useEffect, useRef, useCallback } from 'react';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Phone, label: 'Contact', path: '/contact' },
  { icon: null, label: '', path: '' },
  { icon: ShoppingCart, label: 'Cart', path: '/cart' },
  { icon: User, label: 'Profile', path: '/account' },
];

// Fixed defaults used before settings load — prevents layout jump
const DEFAULT_NAV_HEIGHT = 56;
const DEFAULT_PLUS_WIDTH = 48;
const DEFAULT_PLUS_HEIGHT = 48;
const DEFAULT_PLUS_ICON_RATIO = 50;
const DEFAULT_PLUS_OFFSET_Y = -28;

function getSettingNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function MobileBottomNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const prevCartCount = useRef(cartCount);
  const cartBounceTimeoutRef = useRef<number | null>(null);
  const [cartBounce, setCartBounce] = useState(false);
  const [cartAnimationKey, setCartAnimationKey] = useState(0);
  const [showCategories, setShowCategories] = useState(false);
  const { data: categories } = useCategories();
  const { language } = useLanguageStore();
  const { data: settings } = useSiteSettings();
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);
  const lastScrollY = useRef(0);
  const rafId = useRef<number | null>(null);
  const scrollAccumulator = useRef(0);
  const lastDirection = useRef<1 | -1 | 0>(0);

  const isEnabled = settings?.bottom_nav_enabled !== 'false';
  const hideOnScroll = settings?.bottom_nav_hide_on_scroll !== 'false';
  const navHeight = getSettingNumber(settings?.bottom_nav_height, DEFAULT_NAV_HEIGHT, 48, 96);
  const plusWidth = getSettingNumber(settings?.bottom_nav_plus_width, DEFAULT_PLUS_WIDTH, 40, 88);
  const plusHeight = getSettingNumber(settings?.bottom_nav_plus_height, DEFAULT_PLUS_HEIGHT, 40, 88);
  const plusIconRatio = getSettingNumber(settings?.bottom_nav_plus_icon_ratio, DEFAULT_PLUS_ICON_RATIO, 35, 80);
  const plusOffsetY = getSettingNumber(settings?.bottom_nav_plus_offset_y, DEFAULT_PLUS_OFFSET_Y, -48, 24);
  const plusIconSize = Math.round((Math.min(plusWidth, plusHeight) * plusIconRatio) / 100);
  const hiddenY = navHeight + Math.abs(Math.min(plusOffsetY, 0)) + 40;

  const setNavVisible = useCallback((next: boolean) => {
    if (visibleRef.current === next) return;
    visibleRef.current = next;
    setVisible(next);
  }, []);

  const handleScroll = useCallback(() => {
    if (rafId.current !== null) return;

    rafId.current = window.requestAnimationFrame(() => {
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - lastScrollY.current;

      if (!hideOnScroll) {
        setNavVisible(true);
        scrollAccumulator.current = 0;
        lastDirection.current = 0;
        lastScrollY.current = currentY;
        rafId.current = null;
        return;
      }

      if (Math.abs(delta) < 1) {
        rafId.current = null;
        return;
      }

      // Always show at top
      if (currentY <= 24) {
        setNavVisible(true);
        scrollAccumulator.current = 0;
        lastDirection.current = 0;
        lastScrollY.current = currentY;
        rafId.current = null;
        return;
      }

      // Always show at bottom (near footer)
      const distanceFromBottom = document.documentElement.scrollHeight - window.innerHeight - currentY;
      if (distanceFromBottom < 80) {
        setNavVisible(true);
        scrollAccumulator.current = 0;
        lastDirection.current = 0;
        lastScrollY.current = currentY;
        rafId.current = null;
        return;
      }

      const direction: 1 | -1 = delta > 0 ? 1 : -1;
      if (lastDirection.current !== direction) {
        scrollAccumulator.current = 0;
        lastDirection.current = direction;
      }

      scrollAccumulator.current += delta;

      if (scrollAccumulator.current > 22 && currentY > 88) {
        setNavVisible(false);
        setShowCategories(false);
        scrollAccumulator.current = 0;
      } else if (scrollAccumulator.current < -16) {
        setNavVisible(true);
        scrollAccumulator.current = 0;
      }

      lastScrollY.current = currentY;
      rafId.current = null;
    });
  }, [hideOnScroll, setNavVisible]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    scrollAccumulator.current = 0;
    lastDirection.current = 0;
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [handleScroll]);

  // Cart bounce animation trigger — works for every add (including same product quantity increases)
  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBounce(false);
      window.requestAnimationFrame(() => {
        setCartBounce(true);
        setCartAnimationKey((prev) => prev + 1);
      });

      if (cartBounceTimeoutRef.current !== null) {
        window.clearTimeout(cartBounceTimeoutRef.current);
      }

      cartBounceTimeoutRef.current = window.setTimeout(() => {
        setCartBounce(false);
      }, 700);
    }

    prevCartCount.current = cartCount;

    return () => {
      if (cartBounceTimeoutRef.current !== null) {
        window.clearTimeout(cartBounceTimeoutRef.current);
        cartBounceTimeoutRef.current = null;
      }
    };
  }, [cartCount]);

  if (!isMobile) return null;
  if (location.pathname.startsWith('/admin')) return null;
  if (!isEnabled) return null;

  const navContent = (
    <>
      {/* Categories overlay */}
      <AnimatePresence>
        {showCategories && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[59] bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCategories(false)}
          />
        )}
      </AnimatePresence>

      {/* Categories popup */}
      <AnimatePresence>
        {showCategories && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-4 right-4 z-[61] bg-background rounded-2xl shadow-2xl p-5 pb-4 border border-border/50"
            style={{ bottom: `calc(env(safe-area-inset-bottom) + ${navHeight + 16}px)` }}
          >
            <h3 className="text-center font-bold text-lg mb-4">Categories</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setShowCategories(false);
                    navigate(`/c/${cat.slug}`);
                  }}
                  className="px-4 py-3 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors text-center"
                >
                  {language === 'bn' ? cat.name_bn : cat.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowCategories(false);
                  navigate('/all-products');
                }}
                className="px-4 py-3 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors text-center"
              >
                All Products
              </button>
              <button
                onClick={() => {
                  setShowCategories(false);
                  navigate('/wishlist');
                }}
                className="px-4 py-3 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-muted/80 transition-colors text-center flex items-center justify-center gap-1.5"
              >
                <span>❤️</span> Wishlist
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        style={{
          transform: `translate3d(0, ${visible ? 0 : hiddenY}px, 0)`,
          transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
        className="fixed bottom-0 inset-x-0 z-[60] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="absolute inset-0 bg-background/90 backdrop-blur-xl border-t border-border/50" />

        <div className="relative flex items-end justify-around px-2" style={{ height: `${navHeight}px` }}>
          {navItems.map((item, i) => {
            if (i === 2) {
              return (
                <div
                  key="center"
                  className="relative flex items-center justify-center"
                  style={{
                    /* Use a fixed translateY so there's no jump on settings load */
                    transform: `translateY(${DEFAULT_PLUS_OFFSET_Y}px)`,
                    width: `${DEFAULT_PLUS_WIDTH}px`,
                    height: `${DEFAULT_PLUS_HEIGHT}px`,
                  }}
                >
                  <button
                    onClick={() => setShowCategories((v) => !v)}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      /* Animate from default to actual value smoothly */
                      transform: `translateY(${plusOffsetY - DEFAULT_PLUS_OFFSET_Y}px)`,
                      transition: 'transform 200ms ease-out',
                    }}
                  >
                    <motion.div
                      animate={{ rotate: showCategories ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'rounded-full flex items-center justify-center shadow-lg',
                        showCategories
                          ? 'bg-destructive text-destructive-foreground shadow-destructive/30'
                          : 'bg-foreground text-background shadow-foreground/30'
                      )}
                      style={{ width: `${plusWidth}px`, height: `${plusHeight}px` }}
                    >
                      <Plus style={{ width: `${plusIconSize}px`, height: `${plusIconSize}px` }} strokeWidth={2.5} />
                    </motion.div>
                  </button>
                </div>
              );
            }

            const Icon = item.icon!;
            const isActive = location.pathname === item.path;
            const hasActiveColor = item.path !== '/' && isActive;
            const isCart = item.path === '/cart';

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setShowCategories(false)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 transition-colors duration-200',
                  hasActiveColor ? 'text-primary' : 'text-foreground'
                )}
              >
                <div className="relative">
                  {isCart ? (
                    <motion.div
                      key={cartAnimationKey}
                      animate={cartBounce ? {
                        scale: [1, 1.4, 0.85, 1.2, 0.95, 1],
                        rotate: [0, -15, 12, -8, 4, 0],
                        y: [0, -6, 2, -3, 0],
                      } : { scale: 1, rotate: 0, y: 0 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Icon className="h-5 w-5" strokeWidth={hasActiveColor ? 2.5 : 2} />
                    </motion.div>
                  ) : (
                    <Icon className="h-5 w-5" strokeWidth={hasActiveColor ? 2.5 : 2} />
                  )}
                  {isCart && cartCount > 0 && (
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 12, mass: 0.5 }}
                        className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1"
                      >
                        {/* Glowing pulse ring */}
                        <span className="absolute inset-0 rounded-full bg-destructive animate-ping opacity-40" />
                        <span className="absolute -inset-0.5 rounded-full bg-destructive/30 animate-pulse" />
                        <span className="relative z-10">{cartCount}</span>
                      </motion.span>
                    </AnimatePresence>
                  )}
                </div>
                <span className={cn('text-[10px]', hasActiveColor ? 'font-semibold' : 'font-medium')}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );

  return createPortal(navContent, document.body);
}
