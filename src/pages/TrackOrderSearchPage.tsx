import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopLayout } from '@/components/layout/ShopLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, Truck, MapPin, Clock } from 'lucide-react';

const normalizeOrderId = (value: string) => value.trim().replace(/\s+/g, '').toUpperCase();

const toPreferredOrderId = (value: string) => {
  const normalized = normalizeOrderId(value);
  if (normalized.startsWith('RKP-')) return `RK-${normalized.slice(4)}`;
  return normalized;
};

export default function TrackOrderSearchPage() {
  const [orderId, setOrderId] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = toPreferredOrderId(orderId);
    if (normalized) {
      navigate(`/track-order/${encodeURIComponent(normalized)}`);
    }
  };

  return (
    <ShopLayout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Package className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Search className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">অর্ডার ট্র্যাক করুন</h1>
        <p className="text-muted-foreground text-sm md:text-base mb-8 text-center max-w-md">
          আপনার অর্ডার আইডি লিখুন এবং আপনার অর্ডারের বর্তমান অবস্থা দেখুন
        </p>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="অর্ডার আইডি লিখুন (যেমন: RK-XXXXXX)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.replace(/\s+/g, '').toUpperCase())}
                className="pl-10 h-12 rounded-xl border-2 focus:border-primary text-base"
              />
            </div>
            <Button
              type="submit"
              disabled={!toPreferredOrderId(orderId)}
              className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              ট্র্যাক
            </Button>
          </div>
        </form>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full max-w-lg">
          {[
            { icon: Clock, title: 'রিয়েল-টাইম আপডেট', desc: 'লাইভ অর্ডার স্ট্যাটাস' },
            { icon: Truck, title: 'শিপমেন্ট ট্র্যাকিং', desc: 'ডেলিভারি তথ্য দেখুন' },
            { icon: MapPin, title: 'ডেলিভারি লোকেশন', desc: 'আপনার ঠিকানা যাচাই' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center p-4 rounded-xl bg-card border">
              <item.icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs font-semibold text-foreground">{item.title}</p>
              <p className="text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </ShopLayout>
  );
}
