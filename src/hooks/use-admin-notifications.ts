import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type OrderRow = {
  id: string;
  customer_name: string;
  total: number;
  order_id: string;
  created_at: string;
};

type ReviewRow = {
  id: string;
  customer_name: string;
  rating: number;
  created_at: string;
};


export function useAdminNotifications() {
  const seenOrderIds = useRef<Set<string>>(new Set());
  const seenReviewIds = useRef<Set<string>>(new Set());
  const startedAt = useRef(new Date().toISOString());

  useEffect(() => {
    const notifyOrder = (order: OrderRow) => {
      if (seenOrderIds.current.has(order.id)) return;
      seenOrderIds.current.add(order.id);

      const title = '🛒 নতুন অর্ডার!';
      const body = `${order.customer_name} — ৳${order.total} (${order.order_id})`;
      toast.success(title, { description: body, duration: 10000 });
      playNotificationSound();
    };

    const notifyReview = (review: ReviewRow) => {
      if (seenReviewIds.current.has(review.id)) return;
      seenReviewIds.current.add(review.id);

      const safeRating = Math.max(0, Math.min(5, Number(review.rating) || 0));
      const title = '⭐ নতুন রিভিউ!';
      const body = `${review.customer_name} — ${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`;
      toast.info(title, { description: body, duration: 8000 });
      playNotificationSound();
    };

    const seedRecentIds = async () => {
      const [ordersRes, reviewsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('product_reviews')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      ordersRes.data?.forEach((o: { id: string }) => seenOrderIds.current.add(o.id));
      reviewsRes.data?.forEach((r: { id: string }) => seenReviewIds.current.add(r.id));
    };

    const pollLatest = async () => {
      const [ordersRes, reviewsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, customer_name, total, order_id, created_at')
          .gt('created_at', startedAt.current)
          .order('created_at', { ascending: true })
          .limit(20),
        supabase
          .from('product_reviews')
          .select('id, customer_name, rating, created_at')
          .gt('created_at', startedAt.current)
          .order('created_at', { ascending: true })
          .limit(20),
      ]);

      if (!ordersRes.error) {
        (ordersRes.data as OrderRow[] | null)?.forEach(notifyOrder);
      }
      if (!reviewsRes.error) {
        (reviewsRes.data as ReviewRow[] | null)?.forEach(notifyReview);
      }
    };

    void seedRecentIds().then(() => void pollLatest());

    const channel = supabase
      .channel(`admin-live-notifications-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => notifyOrder(payload.new as OrderRow)
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'product_reviews' },
        (payload) => notifyReview(payload.new as ReviewRow)
      )
      .subscribe((status) => {
        console.log('[Admin Notifications] Realtime status:', status);
      });

    const pollTimer = window.setInterval(() => {
      void pollLatest();
    }, 10000);

    return () => {
      window.clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, []);
}

function playNotificationSound() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.12);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.value = 1140;
    gain2.gain.value = 0.15;
    osc2.start(ctx.currentTime + 0.16);
    osc2.stop(ctx.currentTime + 0.28);
  } catch {
    // silent fail
  }
}

