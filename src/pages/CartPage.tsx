import { Link } from 'react-router-dom';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { useCartStore, type CartItem } from '@/stores/cart-store';
import { useLanguageStore } from '@/stores/language-store';
import { formatBDT } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, clearCart } = useCartStore();
  const { t } = useLanguageStore();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const subtotal = getSubtotal();
  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Math.round(subtotal * (appliedCoupon.value / 100))
      : appliedCoupon.value
    : 0;
  const total = subtotal - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      toast.error('Invalid coupon code');
    } else if (data.min_spend && subtotal < data.min_spend) {
      toast.error(`Minimum spend: ${formatBDT(data.min_spend)}`);
    } else {
      setAppliedCoupon({ code: data.code, type: data.type, value: data.value });
      toast.success(`Coupon ${data.code} applied!`);
    }
    setApplyingCoupon(false);
  };

  if (items.length === 0) {
    return (
      <ShopLayout>
        <div className="container-shop py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('emptyCart')}</h1>
          <Link to="/">
            <Button className="mt-4">{t('continueShopping')}</Button>
          </Link>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="container-shop py-6">
        <h1 className="text-2xl font-bold mb-6">{t('yourCart')}</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={`${item.id}-${item.size || ''}`} className="flex gap-4 p-4 rounded-xl border bg-card">
                <Link to={`/p/${item.slug}`} className="flex-shrink-0">
                  <img src={item.image} alt={item.title} className="w-20 h-20 rounded-lg object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/p/${item.slug}`}>
                    <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">{item.title}</h3>
                  </Link>
                  {item.size && (
                    <span className="inline-block mt-0.5 text-xs bg-muted px-2 py-0.5 rounded font-medium">Size: {item.size}</span>
                  )}
                  <p className="font-bold mt-1">{formatBDT(item.price)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border rounded-lg">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-sale h-8 w-8" onClick={() => removeItem(item.id, item.size)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-32 h-fit">
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-lg">{t('subtotal')}</h2>

              {/* Coupon */}
              <div className="flex gap-2">
                <Input
                  placeholder={t('couponCode')}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={handleApplyCoupon} disabled={applyingCoupon}>
                  {t('apply')}
                </Button>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-success">✓ {appliedCoupon.code}</span>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setAppliedCoupon(null)}>
                    {t('remove')}
                  </Button>
                </div>
              )}

              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span>{formatBDT(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>{t('discount')}</span>
                    <span>-{formatBDT(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>{t('total')}</span>
                  <span>{formatBDT(total)}</span>
                </div>
              </div>

              <Link to="/checkout" state={{ coupon: appliedCoupon }}>
                <Button className="w-full" size="lg">
                  {t('proceedToCheckout')}
                </Button>
              </Link>
              <Link to="/" className="block text-center text-sm text-primary hover:underline">
                {t('continueShopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
