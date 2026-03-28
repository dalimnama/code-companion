import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnnouncementBar } from './AnnouncementBar';
import { Header } from './Header';
import { Footer } from './Footer';
import { lazy, Suspense } from 'react';
const AiFloatingButton = lazy(() => import('@/components/AiFloatingButton').then(m => ({ default: m.AiFloatingButton })));
import { useFacebookPixel } from '@/hooks/use-facebook-pixel';
import { MobileBottomNav } from './MobileBottomNav';

interface ShopLayoutProps {
  children: React.ReactNode;
}

export function ShopLayout({ children }: ShopLayoutProps) {
  useFacebookPixel();

  const headerWrapRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [visualOffsetTop, setVisualOffsetTop] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isMounted) return;

    const headerElement = headerWrapRef.current;
    if (!headerElement) return;

    const viewport = window.visualViewport;

    const updateHeaderMetrics = () => {
      const nextHeight = Math.ceil(headerElement.getBoundingClientRect().height);
      setHeaderHeight((prev) => (prev !== nextHeight ? nextHeight : prev));

      const nextOffsetTop = isIOS ? Math.max(0, Math.round(viewport?.offsetTop ?? 0)) : 0;
      setVisualOffsetTop((prev) => (prev !== nextOffsetTop ? nextOffsetTop : prev));
    };

    updateHeaderMetrics();

    const resizeObserver = new ResizeObserver(updateHeaderMetrics);
    resizeObserver.observe(headerElement);

    window.addEventListener('resize', updateHeaderMetrics);

    if (isIOS && viewport) {
      viewport.addEventListener('resize', updateHeaderMetrics);
      viewport.addEventListener('scroll', updateHeaderMetrics);
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeaderMetrics);
      if (isIOS && viewport) {
        viewport.removeEventListener('resize', updateHeaderMetrics);
        viewport.removeEventListener('scroll', updateHeaderMetrics);
      }
    };
  }, [isMounted, isIOS]);

  const headerNode = (
    <div
      ref={headerWrapRef}
      className="fixed inset-x-0 z-[70] bg-background transition-[top] duration-200 ease-out"
      style={{ top: visualOffsetTop }}
    >
      <AnnouncementBar />
      <Header />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col w-full">
      {isMounted ? createPortal(headerNode, document.body) : headerNode}

      <main className="flex-1" style={{ paddingTop: isMounted ? headerHeight + visualOffsetTop : 0 }}>
        {children}
      </main>

      <Footer />
      <div className="md:hidden h-12" /> {/* spacer below footer for bottom nav */}
      <MobileBottomNav />
      <Suspense fallback={null}><AiFloatingButton /></Suspense>
    </div>
  );
}



