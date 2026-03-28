import { ShopLayout } from '@/components/layout/ShopLayout';
import { useLanguageStore } from '@/stores/language-store';
import { useSiteSettings } from '@/hooks/use-site-settings';

export default function ContactPage() {
  const { t } = useLanguageStore();
  const { data: settings } = useSiteSettings();

  const phone = settings?.phone || '01840469120';
  const whatsapp = settings?.whatsapp || '8801840469120';
  const email = settings?.email || 'rikapioshop@gmail.com';
  const address = settings?.address || 'Dhaka, Bangladesh';
  const businessHours = settings?.business_hours || 'Sat-Thu, 10:00 AM - 8:00 PM';

  return (
    <ShopLayout>
      <div className="container-shop py-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('contactUs')}</h1>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-card border rounded-xl p-6 space-y-3">
            <h3 className="font-semibold">📞 Phone</h3>
            <a href={`tel:+88${phone}`} className="text-muted-foreground hover:text-primary transition-colors">+88{phone}</a>
            <p className="text-sm text-muted-foreground">{businessHours}</p>
          </div>
          <div className="bg-card border rounded-xl p-6 space-y-3">
            <h3 className="font-semibold">💬 WhatsApp</h3>
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">+{whatsapp}</a>
            <p className="text-sm text-muted-foreground">Available 24/7</p>
          </div>
          <div className="bg-card border rounded-xl p-6 space-y-3">
            <h3 className="font-semibold">📧 Email</h3>
            <a href={`mailto:${email}`} className="text-muted-foreground hover:text-primary transition-colors">{email}</a>
            <p className="text-sm text-muted-foreground">We reply within 24 hours</p>
          </div>
          <div className="bg-card border rounded-xl p-6 space-y-3">
            <h3 className="font-semibold">📍 Office</h3>
            <p className="text-muted-foreground">{address}</p>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
