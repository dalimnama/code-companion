import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { useLanguageStore } from '@/stores/language-store';
import { useCartStore } from '@/stores/cart-store';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Package } from 'lucide-react';

export default function OrderSuccessPage() {
  const { t } = useLanguageStore();
  const { clearCart } = useCartStore();
  const location = useLocation();
  const orderData = location.state as any;
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (orderData) {
      clearCart();
    }
  }, []);

  const { data: siteSettings } = useSiteSettings();

  const handleDownloadReceipt = async () => {
    if (!orderData || isDownloading) return;

    setIsDownloading(true);
    try {
      const { generateReceiptPDF } = await import('@/lib/generate-receipt');
      await generateReceiptPDF(orderData, siteSettings);
    } catch {
      import('sonner').then(({ toast }) => toast.error('Receipt download failed, try again.'));
    } finally {
      setIsDownloading(false);
    }
  };

  if (!orderData) {
    return (
      <ShopLayout>
        <div className="container-shop py-20 text-center">
          <p className="text-muted-foreground">No order data found.</p>
          <Link to="/"><Button className="mt-4">{t('backToHome')}</Button></Link>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="container-shop py-10 max-w-2xl mx-auto">
        <div className="text-center py-8 animate-fade-in">
          {/* Animated checkmark with decorative dots */}
          <div className="relative inline-block mb-8">
            <div className="absolute -top-6 left-4 w-4 h-4 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="absolute -top-3 right-8 w-3 h-3 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0.7s' }} />
            <div className="absolute top-2 -right-8 w-5 h-5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
            <div className="absolute top-16 -right-6 w-6 h-6 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0.9s' }} />
            <div className="absolute bottom-4 -right-4 w-3 h-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.6s' }} />
            <div className="absolute bottom-0 left-6 w-4 h-4 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-20 -left-10 w-8 h-8 rounded-full border-2 border-dashed border-blue-300 animate-spin" style={{ animationDuration: '4s' }} />
            <div className="absolute -top-2 left-16 w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '1s' }} />

            {/* Outer ring */}
            <div className="w-40 h-40 rounded-full bg-green-100 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/30">
                <CheckCircle className="h-16 w-16 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-8 leading-tight">
            Your Order has been<br />processed successfully
          </h1>

          {/* Order ID Card - tap to copy */}
          <div
            className="inline-block bg-muted/50 rounded-2xl px-10 py-6 mb-8 cursor-pointer active:scale-95 transition-transform"
            onClick={() => {
              navigator.clipboard.writeText(orderData.order_id);
              import('sonner').then(({ toast }) => toast.success('Order ID copied!'));
            }}
          >
            <p className="text-sm text-muted-foreground mb-1">Order ID <span className="text-xs">(tap to copy)</span></p>
            <p className="text-2xl md:text-3xl font-bold font-mono tracking-wider">{orderData.order_id}</p>
          </div>

          {/* Track Order Button */}
          <div className="mb-4 flex justify-center">
            <Link to={`/track-order/${orderData.order_id}`} className="w-full max-w-sm">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white w-full py-6 text-lg rounded-full gap-2">
                <Package className="h-5 w-5" />
                Track your order
              </Button>
            </Link>
          </div>

          {/* Continue Shopping Button */}
          <div className="mb-6 flex justify-center">
            <Link to="/" className="w-full max-w-xs">
              <Button variant="outline" size="lg" className="border-green-600 text-green-700 hover:bg-green-50 w-full py-5 rounded-full text-base">
                Continue shopping
              </Button>
            </Link>
          </div>

          {/* Download Receipt */}
          <button
            onClick={handleDownloadReceipt}
            disabled={isDownloading}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors disabled:opacity-70"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Preparing...' : 'Download Receipt'}
          </button>
        </div>
      </div>
    </ShopLayout>
  );
}

