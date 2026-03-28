import { Link } from 'react-router-dom';
import { 
  Palette, Image, Square, Smartphone, ShoppingBag, ShoppingCart,
  Globe, Phone, CreditCard, Truck, Share2, BarChart3, ArrowLeft, Bot, LayoutDashboard, Star
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const sections = [
  { path: 'logo', icon: Palette, label: '🎨 লোগো', desc: 'লোগো টাইপ, সাইজ ও ইমেজ' },
  { path: 'banner', icon: Image, label: '🖼️ ব্যানার', desc: 'ব্যানার ওভারলে ও প্রগ্রেস বার' },
  { path: 'footer', icon: Square, label: '🦶 ফুটার কপিরাইট', desc: 'কপিরাইট বার স্টাইল' },
  { path: 'bottom-nav', icon: Smartphone, label: '📱 বটম নেভিগেশন', desc: 'মোবাইল নেভ বার কাস্টমাইজ' },
  { path: 'quickview', icon: ShoppingBag, label: '🛍️ কুইক ভিউ পপআপ', desc: 'পপআপ সাইজ ও রেডিয়াস' },
  { path: 'order-button', icon: ShoppingCart, label: '🛒 অর্ডার বাটন', desc: 'বাটন হাইট, বর্ডার ও কালার' },
  { path: 'image-ratio', icon: Image, label: '🖼️ ইমেজ রেশিও', desc: 'প্রোডাক্ট ইমেজ রেশিও' },
  { path: 'image-radius', icon: Square, label: '🔲 ইমেজ রেডিয়াস', desc: 'ইমেজ কর্নার রেডিয়াস' },
  { path: 'tracking', icon: BarChart3, label: '📊 ট্র্যাকিং', desc: 'Facebook Pixel সেটআপ' },
  { path: 'general', icon: Globe, label: '⚙️ সাধারণ সেটিংস', desc: 'যোগাযোগ, পেমেন্ট, শিপিং, সোশ্যাল' },
  { path: 'colors', icon: Palette, label: '🎨 কালার সেটিংস', desc: 'ওয়েবসাইট কম্বিনেশন কালার' },
  { path: 'ai', icon: Bot, label: '🤖 AI অ্যাসিস্ট্যান্ট', desc: 'চ্যাটবট নাম, প্রম্পট ও কনফিগ' },
  { path: 'homepage-sections', icon: LayoutDashboard, label: '🏠 হোমপেজ সেকশন', desc: 'Trust Badges, Reviews অন/অফ' },
  { path: 'reviews', icon: Star, label: '⭐ কাস্টমার রিভিউ', desc: 'রিভিউ যোগ, এডিট ও ডিলিট' },
  { path: 'social-media', icon: Share2, label: '📱 সোশ্যাল মিডিয়া', desc: 'ফুটার সোশ্যাল লিংক ম্যানেজ' },
];

export default function SettingsHub() {
  return (
    <div className="space-y-6">
      <AdminPageHeader>
        <h1 className="text-2xl font-bold">সাইট সেটিংস</h1>
      </AdminPageHeader>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.path}
            to={`/admin/settings/${s.path}`}
            className="group flex items-start gap-4 bg-card border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{s.label}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
