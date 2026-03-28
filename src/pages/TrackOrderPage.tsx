import { useState } from 'react';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { supabase } from '@/integrations/supabase/client';
import { formatBDT } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, User, Truck, Clock, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const statusSteps = [
  { key: 'pending', label: 'অর্ডার গ্রহণ', icon: CheckCircle },
  { key: 'confirmed', label: 'কনফার্মড', icon: CheckCircle },
  { key: 'processing', label: 'প্রসেসিং', icon: Package },
  { key: 'shipped', label: 'শিপড', icon: Truck },
  { key: 'delivered', label: 'ডেলিভারড', icon: CheckCircle },
];

function getStatusIndex(status: string) {
  const idx = statusSteps.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

function normalizeOrderId(value: string) {
  try {
    return decodeURIComponent(value).trim().replace(/\s+/g, '').toUpperCase();
  } catch {
    return value.trim().replace(/\s+/g, '').toUpperCase();
  }
}

function getOrderIdCandidates(value: string) {
  const normalized = normalizeOrderId(value);
  if (!normalized) return [];

  const candidates = [normalized];

  if (normalized.startsWith('RKP-')) {
    candidates.push(`RK-${normalized.slice(4)}`);
  } else if (normalized.startsWith('RK-')) {
    candidates.push(`RKP-${normalized.slice(3)}`);
  }

  return [...new Set(candidates)];
}

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: siteSettings } = useSiteSettings();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['track-order', orderId],
    queryFn: async () => {
      const candidates = getOrderIdCandidates(orderId ?? '');
      for (const candidate of candidates) {
        const { data, error } = await supabase.rpc('track_order', { _order_id: candidate });
        if (error) throw error;
        if (data?.length) return data[0];
      }
      return null;
    },
    enabled: !!orderId?.trim(),
  });

  if (isLoading) {
    return (
      <ShopLayout>
        <div className="container-shop py-10 max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </ShopLayout>
    );
  }

  if (error || !order) {
    return (
      <ShopLayout>
        <div className="container-shop py-20 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">অর্ডার পাওয়া যায়নি</h1>
          <p className="text-muted-foreground mb-4">অর্ডার আইডি "{orderId}" দিয়ে কোনো অর্ডার পাওয়া যায়নি।</p>
          <Link to="/"><Button>হোম এ যান</Button></Link>
        </div>
      </ShopLayout>
    );
  }

  const items = (order.items as any[]) || [];
  const currentStatusIdx = getStatusIndex(order.status);

  const orderDataForReceipt = {
    ...order,
    items,
  };

  const handleDownloadReceipt = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const { generateReceiptPDF } = await import('@/lib/generate-receipt');
      await generateReceiptPDF(orderDataForReceipt, siteSettings);
    } catch {
      import('sonner').then(({ toast }) => toast.error('রিসিপ্ট ডাউনলোড ব্যর্থ হয়েছে'));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ShopLayout>
      <div className="container-shop py-10 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">অর্ডার ট্র্যাকিং</h1>
          <p className="text-muted-foreground text-sm mt-1">অর্ডার আইডি: <strong>{order.order_id}</strong></p>
        </div>

        {/* Status Timeline */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-green-500 transition-all"
              style={{ width: `${(currentStatusIdx / (statusSteps.length - 1)) * 100}%` }}
            />
            {statusSteps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i <= currentStatusIdx;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs mt-2 text-center ${isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-card border rounded-xl p-5 space-y-1">
          <h3 className="font-bold flex items-center gap-2 mb-2"><User className="h-4 w-4" /> কাস্টমার তথ্য</h3>
          <div className="text-sm space-y-1 pl-6">
            <p><strong>নাম:</strong> {order.customer_name}</p>
            <p><strong>ঠিকানা:</strong> {order.address}, {order.area}, {order.city}</p>
            <p><strong>ফোন:</strong> {order.customer_phone}</p>
            <p><strong>ইমেইল:</strong> {order.customer_email}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-card border rounded-xl p-5 space-y-3">
          <h3 className="font-bold flex items-center gap-2"><Package className="h-4 w-4" /> প্রোডাক্ট</h3>
          {items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-4 border rounded-xl p-3">
              <img src={item.image} alt={item.title} className="w-14 h-14 rounded-lg object-cover" loading="lazy" decoding="async" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">পরিমাণ: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold">{formatBDT(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        {/* Order Details */}
        <div className="bg-card border rounded-xl p-5 text-sm space-y-1">
          <p><strong>পেমেন্ট:</strong> {order.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : order.payment_method === 'bkash' ? 'বিকাশ' : 'নগদ'}</p>
          {order.transaction_id && <p><strong>TxnID:</strong> {order.transaction_id}</p>}
          {order.notes && <p><strong>নোট:</strong> {order.notes}</p>}
          <div className="border-t pt-3 mt-3 space-y-1">
            {order.discount_amount > 0 && <p><strong>ডিসকাউন্ট:</strong> {formatBDT(order.discount_amount)}</p>}
            <p><strong>ডেলিভারি চার্জ:</strong> {formatBDT(order.shipping_cost)}</p>
            <p className="text-lg font-bold"><strong>মোট:</strong> {formatBDT(order.total)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 pb-6">
          <Button
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50 rounded-full px-8"
            onClick={handleDownloadReceipt}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'প্রসেস হচ্ছে...' : 'রিসিপ্ট ডাউনলোড'}
          </Button>
          <Link to="/">
            <Button className="bg-green-700 hover:bg-green-800 text-white px-10 rounded-xl w-full sm:w-auto">
              শপিং চালিয়ে যান
            </Button>
          </Link>
        </div>
      </div>
    </ShopLayout>
  );
}

