import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Search, Play, Pause, Maximize, Minimize, Grid3X3 } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DEFAULT_ZOOM = 2.5;

export function ImageLightbox({ images, initialIndex, open, onClose }: ImageLightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgCallbackRef = useCallback((node: HTMLImageElement | null) => {
    if (node) imgRef.current = node;
  }, []);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchDeltaRef = useRef(0);
  const isPanningRef = useRef(false);
  const panRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const zoomedRef = useRef(false);
  const scaleRef = useRef(1);
  const pinchStartDistRef = useRef(0);
  const pinchStartScaleRef = useRef(1);
  const isPinchingRef = useRef(false);

  useEffect(() => { zoomedRef.current = zoomed; }, [zoomed]);

  const getImageEl = useCallback(() => {
    if (imgRef.current?.isConnected) return imgRef.current;
    const fallback = containerRef.current?.querySelector('[data-lightbox-active="true"]') as HTMLImageElement | null;
    if (fallback) imgRef.current = fallback;
    return fallback;
  }, []);

  const applyTransform = useCallback((x: number, y: number, scale: number, animate = false) => {
    const el = getImageEl();
    if (!el) return;
    el.style.transition = animate ? 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' : 'none';
    el.style.transform = scale <= 1
      ? 'scale(1)'
      : `scale(${scale}) translate(${x / scale}px, ${y / scale}px)`;
    el.style.willChange = 'transform';
  }, [getImageEl]);

  const resetAll = useCallback(() => {
    panRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
    const el = getImageEl();
    if (el) {
      el.style.transition = 'transform 0.3s cubic-bezier(0.16,1,0.3,1)';
      el.style.transform = 'scale(1)';
    }
  }, [getImageEl]);

  // Preload
  useEffect(() => {
    if (open) images.forEach(src => { const img = new Image(); img.src = src; });
  }, [open, images]);

  useEffect(() => {
    if (open) {
      setCurrent(initialIndex);
      setZoomed(false);
      setShowGrid(false);
      setPlaying(false);
      setDirection(0);
      panRef.current = { x: 0, y: 0 };
      scaleRef.current = 1;
    }
  }, [initialIndex, open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  useEffect(() => {
    if (playing && open) {
      intervalRef.current = setInterval(() => {
        setDirection(1);
        setCurrent(c => (c + 1) % images.length);
      }, 3000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, open, images.length]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent(c => (c + 1) % images.length);
    setZoomed(false);
    panRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
  }, [images.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent(c => (c - 1 + images.length) % images.length);
    setZoomed(false);
    panRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
  }, [images.length]);

  const toggleZoom = useCallback(() => {
    setZoomed(z => {
      if (z) {
        resetAll();
        scaleRef.current = 1;
      } else {
        scaleRef.current = DEFAULT_ZOOM;
        panRef.current = { x: 0, y: 0 };
        requestAnimationFrame(() => {
          applyTransform(0, 0, DEFAULT_ZOOM, true);
        });
      }
      return !z;
    });
  }, [resetAll, applyTransform]);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, goNext, goPrev]);

  // Pinch distance helper
  const getTouchDist = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch handlers with pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Two fingers → pinch
    if (e.touches.length === 2) {
      isPinchingRef.current = true;
      isPanningRef.current = false;
      pinchStartDistRef.current = getTouchDist(e.touches);
      pinchStartScaleRef.current = scaleRef.current;
      return;
    }

    // One finger
    if (zoomedRef.current || scaleRef.current > 1) {
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.touches[0].clientX - panRef.current.x,
        y: e.touches[0].clientY - panRef.current.y,
      };
      return;
    }
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    touchDeltaRef.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Pinch zoom
    if (isPinchingRef.current && e.touches.length === 2) {
      const dist = getTouchDist(e.touches);
      const ratio = dist / pinchStartDistRef.current;
      let newScale = pinchStartScaleRef.current * ratio;
      newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
      scaleRef.current = newScale;

      if (newScale > 1 && !zoomedRef.current) {
        zoomedRef.current = true;
        setZoomed(true);
      }

      applyTransform(panRef.current.x, panRef.current.y, newScale);
      return;
    }

    // One finger pan when zoomed
    if ((zoomedRef.current || scaleRef.current > 1) && isPanningRef.current && e.touches.length === 1) {
      const newX = e.touches[0].clientX - panStartRef.current.x;
      const newY = e.touches[0].clientY - panStartRef.current.y;
      panRef.current = { x: newX, y: newY };
      applyTransform(newX, newY, scaleRef.current);
      return;
    }

    // Swipe detection
    if (!touchStartRef.current) return;
    touchDeltaRef.current = e.touches[0].clientX - touchStartRef.current.x;
  }, [applyTransform]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // End of pinch
    if (isPinchingRef.current) {
      // If remaining touches < 2, end pinch
      if (e.touches.length < 2) {
        isPinchingRef.current = false;
        // Snap to 1 if close
        if (scaleRef.current <= 1.1) {
          scaleRef.current = 1;
          panRef.current = { x: 0, y: 0 };
          zoomedRef.current = false;
          setZoomed(false);
          applyTransform(0, 0, 1, true);
        }
        // If one finger remains, start panning
        if (e.touches.length === 1 && scaleRef.current > 1) {
          isPanningRef.current = true;
          panStartRef.current = {
            x: e.touches[0].clientX - panRef.current.x,
            y: e.touches[0].clientY - panRef.current.y,
          };
        }
      }
      return;
    }

    if ((zoomedRef.current || scaleRef.current > 1) && isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    if (!touchStartRef.current) return;
    const delta = touchDeltaRef.current;
    const threshold = 50;
    if (delta < -threshold && images.length > 1) goNext();
    else if (delta > threshold && images.length > 1) goPrev();
    touchStartRef.current = null;
    touchDeltaRef.current = 0;
  }, [images.length, goNext, goPrev, applyTransform]);

  // Mouse drag for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!zoomedRef.current) return;
    e.preventDefault();
    isPanningRef.current = true;
    panStartRef.current = {
      x: e.clientX - panRef.current.x,
      y: e.clientY - panRef.current.y,
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!zoomedRef.current || !isPanningRef.current) return;
    const newX = e.clientX - panStartRef.current.x;
    const newY = e.clientY - panStartRef.current.y;
    panRef.current = { x: newX, y: newY };
    applyTransform(newX, newY, scaleRef.current);
  }, [applyTransform]);

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  // Mouse wheel zoom for desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    let newScale = scaleRef.current + delta;
    newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    scaleRef.current = newScale;

    if (newScale > 1 && !zoomedRef.current) {
      zoomedRef.current = true;
      setZoomed(true);
    } else if (newScale <= 1 && zoomedRef.current) {
      zoomedRef.current = false;
      setZoomed(false);
      panRef.current = { x: 0, y: 0 };
    }

    applyTransform(panRef.current.x, panRef.current.y, newScale, false);
  }, [applyTransform]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Reset transform when unzoomed
  useEffect(() => {
    const el = getImageEl();
    if (!el) return;
    if (!zoomed) {
      el.style.transition = 'transform 0.3s cubic-bezier(0.16,1,0.3,1)';
      el.style.transform = 'scale(1)';
      scaleRef.current = 1;
    }
  }, [zoomed, current, getImageEl]);

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? '40%' : '-40%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-40%' : '40%', opacity: 0 }),
  };

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col touch-none"
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Top toolbar */}
          <div className="flex items-center justify-between px-3 sm:px-5 py-3 text-white/90 shrink-0">
            <span className="text-sm font-semibold tracking-wide">
              {current + 1} / {images.length}
            </span>
            <div className="flex items-center gap-0.5">
              <ToolBtn icon={Search} active={zoomed} onClick={toggleZoom} label={zoomed ? 'Zoom out' : 'Zoom in'} />
              <ToolBtn icon={playing ? Pause : Play} active={playing} onClick={() => setPlaying(p => !p)} />
              <ToolBtn icon={isFullscreen ? Minimize : Maximize} onClick={toggleFullscreen} />
              <ToolBtn icon={Grid3X3} active={showGrid} onClick={() => { setShowGrid(g => !g); setZoomed(false); }} />
              <ToolBtn icon={X} onClick={onClose} />
            </div>
          </div>

          {/* Main area */}
          <div
            className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {showGrid ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-4 overflow-y-auto max-h-full w-full touch-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrent(i); setShowGrid(false); setDirection(0); }}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      i === current ? 'border-primary ring-2 ring-primary/40' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  <motion.div
                    key={current}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'tween', duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                    className="flex items-center justify-center max-h-full max-w-full"
                  >
                    <img
                      ref={imgCallbackRef}
                      src={images[current]}
                      alt=""
                      data-lightbox-active="true"
                      className={`max-h-[80vh] max-w-full object-contain select-none ${
                        zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
                      }`}
                      onDoubleClick={toggleZoom}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      draggable={false}
                    />
                  </motion.div>
                </AnimatePresence>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={goPrev}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                      <ChevronLeft className="h-7 w-7" />
                    </button>
                    <button
                      onClick={goNext}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                      <ChevronRight className="h-7 w-7" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Bottom thumbnails */}
          {!showGrid && images.length > 1 && (
            <div className="flex gap-2 justify-center px-4 py-3 overflow-x-auto scrollbar-hide shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); setZoomed(false); }}
                  className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    i === current
                      ? 'border-primary ring-2 ring-primary/30 scale-105'
                      : 'border-white/20 opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

function ToolBtn({ icon: Icon, onClick, active, label }: { icon: any; onClick: () => void; active?: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg transition-colors ${
        active ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
