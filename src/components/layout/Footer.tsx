import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Phone, Mail, MapPin, ArrowRight, Heart, ShoppingBag } from 'lucide-react';
import { useLanguageStore } from '@/stores/language-store';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { motion } from 'framer-motion';
import { DynamicLogo } from '@/components/DynamicLogo';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export function Footer() {
  const { t } = useLanguageStore();
  const { data: settings } = useSiteSettings();

  const phone = settings?.phone || '01840469120';
  const email = settings?.email || 'rikapioshop@gmail.com';
  const address = settings?.address || 'Dhaka, Bangladesh';
  const facebookUrl = settings?.facebook_url || 'https://facebook.com/rikapioshop';
  const instagramUrl = settings?.instagram_url || '#';
  const twitterUrl = settings?.twitter_url || '#';
  const youtubeUrl = settings?.youtube_url || '#';
  const showTagline = settings?.footer_tagline_active !== 'false';

  const ensureUrl = (url: string) => {
    if (!url || url === '#') return '#';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const tiktokUrl = settings?.tiktok_url || '';
  const whatsappChannelUrl = settings?.whatsapp_channel_url || '';

  const allSocialLinks = [
    { icon: Facebook, href: ensureUrl(facebookUrl), label: 'Facebook' },
    { icon: Instagram, href: ensureUrl(instagramUrl), label: 'Instagram' },
    { icon: Twitter, href: ensureUrl(twitterUrl), label: 'Twitter' },
    { icon: Youtube, href: ensureUrl(youtubeUrl), label: 'YouTube' },
  ];
  // TikTok & WhatsApp Channel – only show if link provided
  if (tiktokUrl && tiktokUrl !== '#') allSocialLinks.push({ icon: Heart, href: ensureUrl(tiktokUrl), label: 'TikTok' });
  if (whatsappChannelUrl && whatsappChannelUrl !== '#') allSocialLinks.push({ icon: ShoppingBag, href: ensureUrl(whatsappChannelUrl), label: 'WhatsApp Channel' });

  // Only show icons that have a real link
  const socialLinks = allSocialLinks.filter(s => s.href && s.href !== '#');

  return (
    <footer className="relative mt-16 overflow-hidden">
      {/* Decorative top wave */}
      <div className="relative h-16 -mb-1">
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 64" preserveAspectRatio="none">
          <path
            d="M0,32 C360,64 720,0 1080,32 C1260,48 1380,48 1440,32 L1440,64 L0,64 Z"
            className="fill-secondary"
          />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-50" />
      </div>

      <div className="bg-secondary">
        <div className="container-shop pt-12 pb-4 md:pt-16 md:pb-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6"
          >
            {/* Brand Section */}
            <motion.div custom={0} variants={fadeUp} className="lg:col-span-4 flex flex-col items-center text-center lg:items-start lg:text-left">
              <DynamicLogo textClassName="text-3xl font-bold" imgClassName="h-10" />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mt-4">
                {settings?.footer_description || 'Your trusted online shop in Bangladesh. Quality products at the best prices.'}
              </p>

              {/* Social Links */}
              <div className="flex gap-3 mt-5">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="group w-11 h-11 rounded-xl border border-border/60 bg-background flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                  >
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Help & Policies - side by side on mobile, inline on desktop */}
            <motion.div custom={1} variants={fadeUp} className="lg:col-span-5 grid grid-cols-2 gap-6">
              {/* Help */}
              <div>
                <h4 className="font-bold mb-4 sm:mb-5 text-sm uppercase tracking-wider text-foreground/80 flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-primary" />
                  {t('help')}
                </h4>
                <ul className="space-y-2.5 sm:space-y-3">
                  {[
                    { to: '/about', label: t('aboutUs') },
                    { to: '/contact', label: t('contactUs') },
                    { to: '/track-order', label: 'অর্ডার ট্র্যাক করুন' },
                  ].map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="group text-sm text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3 shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" />
                        <span className="group-hover:translate-x-1 transition-transform duration-300">{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Policies */}
              <div>
                <h4 className="font-bold mb-4 sm:mb-5 text-sm uppercase tracking-wider text-foreground/80 flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-primary" />
                  {t('policies')}
                </h4>
                <ul className="space-y-2.5 sm:space-y-3">
                  {[
                    { to: '/privacy-policy', label: t('privacyPolicy') },
                    { to: '/terms', label: t('termsConditions') },
                    { to: '/return-policy', label: t('returnPolicy') },
                    { to: '/shipping-policy', label: t('shippingPolicy') },
                  ].map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="group text-sm text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3 shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" />
                        <span className="group-hover:translate-x-1 transition-transform duration-300">{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div custom={2} variants={fadeUp} className="lg:col-span-3">
              <h4 className="font-bold mb-5 text-sm uppercase tracking-wider text-foreground/80 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-primary" />
                {t('contactUs')}
              </h4>
              <ul className="space-y-4">
                <li>
                  <a href={`https://wa.me/88${phone}`} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-all duration-300">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                      <Phone className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <span className="group-hover:translate-x-0.5 transition-transform duration-300">{phone}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${email}`} className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-all duration-300">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                      <Mail className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <span className="break-all group-hover:translate-x-0.5 transition-transform duration-300">{email}</span>
                  </a>
                </li>
                <li>
                  <div className="group flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <span>{address}</span>
                  </div>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Bottom Bar */}
          {settings?.footer_copyright_active !== 'false' && (
            <div className="mt-10 pt-6 border-t border-border/30">
              <p className="text-center text-xs text-muted-foreground/70 tracking-wide">
                {settings?.copyright_text || '© 2026 rikapio. All rights reserved.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}