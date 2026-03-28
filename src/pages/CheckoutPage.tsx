import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { useCartStore } from '@/stores/cart-store';
import { useLanguageStore } from '@/stores/language-store';
import { formatBDT } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { fbTrack, fbServerEvent } from '@/hooks/use-facebook-pixel';
import { ChevronDown, Minus, Plus, Trash2 } from 'lucide-react';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { trackEvent } from '@/lib/track-event';

export default function CheckoutPage() {
  const { items, getSubtotal, updateQuantity, removeItem } = useCartStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const location = useLocation();
  const coupon = (location.state as any)?.coupon;
  const { data: settings } = useSiteSettings();
  const { user } = useCustomerAuth();

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', area: '', city: '',
    notes: '',
    shipping: 'inside-dhaka',
    payment: 'cod',
    txnId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState(coupon?.code || '');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(coupon || null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const subtotal = getSubtotal();
  const insideDhakaCost = Number(settings?.shipping_cost_inside_dhaka || '60');
  const outsideDhakaCost = Number(settings?.shipping_cost_outside_dhaka || '120');
  const shippingCost = form.shipping === 'inside-dhaka' ? insideDhakaCost : outsideDhakaCost;
  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percent' ? Math.round(subtotal * (appliedCoupon.value / 100)) : appliedCoupon.value
    : 0;
  const total = subtotal - discountAmount + shippingCost;

  // InitiateCheckout tracking
  useEffect(() => {
    if (items.length > 0) {
      const params = {
        content_ids: items.map(i => i.id),
        contents: items.map(i => ({ id: i.id, quantity: i.quantity })),
        content_type: 'product',
        value: subtotal,
        currency: 'BDT',
        num_items: items.reduce((s, i) => s + i.quantity, 0),
      };
      fbTrack('InitiateCheckout', params);
      fbServerEvent('InitiateCheckout', params);
      trackEvent({
        event_type: 'initiate_checkout',
        metadata: { num_items: items.reduce((s, i) => s + i.quantity, 0), value: subtotal },
      });
    }
  }, []);

  // Preload OrderSuccessPage chunk
  useEffect(() => {
    import('./OrderSuccessPage');
  }, []);

  // Auto-fill from logged-in user profile
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setForm(f => ({
            ...f,
            name: data.full_name || f.name,
            phone: data.phone || f.phone,
            email: user.email || f.email,
          }));
        }
      };
      fetchProfile();
    }
  }, [user]);

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

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    if ((form.payment === 'bkash' || form.payment === 'nagad') && !form.txnId.trim()) {
      e.txnId = 'Transaction ID required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    const randomHash = crypto.getRandomValues(new Uint8Array(3)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
    const orderId = `RK-${randomHash.toUpperCase()}`;

    const orderData = {
      order_id: orderId,
      customer_name: form.name,
      customer_email: form.email || 'N/A',
      customer_phone: form.phone,
      address: form.address,
      area: 'N/A',
      city: form.city || 'N/A',
      shipping_method: form.shipping,
      shipping_cost: shippingCost,
      payment_method: form.payment,
      transaction_id: form.txnId || null,
      notes: form.notes || null,
      subtotal,
      discount_amount: discountAmount,
      total,
      items: items.map((i) => ({ id: i.id, title: i.title, image: i.image, price: i.price, quantity: i.quantity, slug: i.slug, size: i.size || null })),
    };

    try {
      const dbPromise = supabase.from('orders').insert(orderData);
      supabase.functions.invoke('send-order-email', { body: orderData }).catch((e) => console.error('Email error:', e));
      supabase.functions.invoke('send-order-telegram', { body: orderData }).catch((e) => console.error('Telegram error:', e));
      supabase.functions.invoke('sync-google-sheet', { body: orderData }).catch((e) => console.error('Google Sheet error:', e));
      supabase.functions.invoke('sync-airtable', { body: orderData }).catch((e) => console.error('Airtable error:', e));

      const purchaseParams = {
        content_ids: items.map(i => i.id),
        contents: items.map(i => ({ id: i.id, quantity: i.quantity })),
        content_type: 'product',
        value: total,
        currency: 'BDT',
        num_items: items.reduce((s, i) => s + i.quantity, 0),
        email: form.email,
        phone: form.phone,
      };
      fbTrack('Purchase', purchaseParams);
      fbServerEvent('Purchase', purchaseParams);
      items.forEach(item => {
        trackEvent({
          event_type: 'purchase',
          product_id: item.id,
          product_title: item.title,
          product_price: item.price,
          product_size: item.size,
          quantity: item.quantity,
          customer_phone: form.phone,
          customer_name: form.name,
        });
      });

      navigate('/order-success', { state: orderData, replace: true });
      toast.success('Order placed successfully!');

      dbPromise.then(({ error: dbError }) => {
        if (dbError) console.error('DB save error:', dbError);
      });
    } catch (err) {
      console.error('Order error:', err);
      toast.error('Something went wrong, please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <ShopLayout>
      <div className="container-shop py-6 max-w-3xl mx-auto">
        {/* Your Cart Section */}
        <h1 className="text-2xl font-bold mb-4">{t('yourCart')}</h1>

        {/* Cart Items */}
        <div className="border rounded-xl overflow-hidden mb-4">
          {items.map((item) => (
            <div key={`${item.id}-${item.size || ''}`} className="flex gap-3 p-3 border-b last:border-b-0">
              <Link to={`/p/${item.slug}`} className="flex-shrink-0">
                <img src={item.image} alt={item.title} className="w-16 h-16 rounded-lg object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/p/${item.slug}`}>
                  <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">{item.title}</h3>
                </Link>
                {item.size && (
                  <span className="inline-block mt-0.5 text-xs bg-muted px-2 py-0.5 rounded font-medium">{item.size}</span>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">x{item.quantity}</p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center border rounded-lg">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-7 text-center text-sm">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="text-sale h-7 w-7" onClick={() => removeItem(item.id, item.size)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <span className="font-bold text-sm whitespace-nowrap">{formatBDT(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Cart Summary Table */}
        <div className="border rounded-xl overflow-hidden mb-4 text-sm">
          <div className="flex justify-between p-3 border-b">
            <span>Cart Total</span>
            <span className="font-medium">{formatBDT(subtotal)}</span>
          </div>
          <div className="flex justify-between p-3 border-b">
            <span>Shipping Charge</span>
            <span className="font-medium">{formatBDT(shippingCost)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between p-3 border-b text-success">
              <span>{t('discount')}</span>
              <span className="font-medium">-{formatBDT(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between p-3 font-bold text-base">
            <span>{t('total')}</span>
            <span>{formatBDT(total)}</span>
          </div>
        </div>

        {/* Coupon */}
        <div className="mb-6">
          {!appliedCoupon ? (
            <Collapsible>
              <CollapsibleTrigger className="text-sm text-primary font-medium hover:underline cursor-pointer">
                Have Coupon?
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={handleApplyCoupon} disabled={applyingCoupon}>
                    Submit
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <div className="flex items-center justify-between text-sm bg-success/10 px-3 py-2 rounded-lg">
              <span className="text-success font-medium">✓ {appliedCoupon.code} applied</span>
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setAppliedCoupon(null)}>
                {t('remove')}
              </Button>
            </div>
          )}
        </div>

        {/* Place Order Section */}
        <h2 className="text-2xl font-bold mb-2">Place Order</h2>

        {!user && (
          <p className="text-sm mb-4">
            <span className="font-bold">Already a customer?</span>{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">Click here to sign in.</Link>
          </p>
        )}

        {/* Order Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="Full Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
            {errors.name && <p className="text-sm text-sale mt-1">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone *</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">+88</span>
              <Input id="phone" className="rounded-l-none" placeholder="Your mobile number" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            {errors.phone && <p className="text-sm text-sale mt-1">{errors.phone}</p>}
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Address *</Label>
            <Textarea id="address" placeholder="Please provide your detailed address." value={form.address} onChange={(e) => update('address', e.target.value)} rows={3} />
            {errors.address && <p className="text-sm text-sale mt-1">{errors.address}</p>}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Your email address" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>

          {/* Shipping Option */}
          <div>
            <Label>Shipping Option *</Label>
            <div className="flex gap-2 mt-1">
              <select
                value={form.shipping}
                onChange={(e) => update('shipping', e.target.value)}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring"
              >
                <option value="inside-dhaka">Inside Dhaka — {formatBDT(insideDhakaCost)}</option>
                <option value="outside-dhaka">Outside Dhaka — {formatBDT(outsideDhakaCost)}</option>
              </select>
            </div>
          </div>

          {/* Note */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-primary transition-colors group cursor-pointer">
              <span>Note</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <Textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="আপনার মতামত বা বিশেষ নির্দেশনা লিখুন..."
                rows={3}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Payment Method */}
          <div className="border-t pt-4">
            <h3 className="text-xl font-bold mb-3">Payment Method</h3>
            <RadioGroup value={form.payment} onValueChange={(v) => update('payment', v)} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="cod" id="p1" />
                <Label htmlFor="p1" className="cursor-pointer flex-1 font-bold">Cash on Delivery</Label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="bkash" id="p2" />
                  <div>
                    <Label htmlFor="p2" className="cursor-pointer font-bold">bKash Payment</Label>
                    <p className="text-xs text-muted-foreground">Make Payment with bKash</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="nagad" id="p3" />
                  <div>
                    <Label htmlFor="p3" className="cursor-pointer font-bold">Nagad Payment</Label>
                    <p className="text-xs text-muted-foreground">Make Payment with Nagad</p>
                  </div>
                </div>
              </div>
            </RadioGroup>

            {(form.payment === 'bkash' || form.payment === 'nagad') && (
              <div className="bg-secondary/50 p-4 rounded-lg space-y-2 mt-3">
                <p className="text-sm">{settings?.payment_instruction || 'Send Money'} {formatBDT(total)} to <strong
                  className="cursor-pointer underline decoration-dashed underline-offset-2 hover:text-primary transition-colors"
                  onClick={() => {
                    const num = form.payment === 'bkash' ? (settings?.bkash_number || '01840469120') : (settings?.nagad_number || '01840469120');
                    navigator.clipboard.writeText(num);
                    toast.success(`${num} কপি হয়েছে!`);
                  }}
                  title="ক্লিক করে নম্বর কপি করুন"
                >{form.payment === 'bkash' ? (settings?.bkash_number || '01840469120') : (settings?.nagad_number || '01840469120')}</strong> ({form.payment === 'bkash' ? 'bKash' : 'Nagad'})</p>
                <div>
                  <Label htmlFor="txnId">{t('transactionId')} *</Label>
                  <Input id="txnId" value={form.txnId} onChange={(e) => update('txnId', e.target.value)} />
                  {errors.txnId && <p className="text-sm text-sale mt-1">{errors.txnId}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button onClick={handlePlaceOrder} className="w-full mt-4" size="lg" disabled={placing}>
            {placing ? 'Processing...' : 'Submit Order'}
          </Button>
        </div>
      </div>
    </ShopLayout>
  );
}
