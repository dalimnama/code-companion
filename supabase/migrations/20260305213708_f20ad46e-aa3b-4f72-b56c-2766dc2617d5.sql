
INSERT INTO public.site_settings (key, value, category, label) VALUES
  ('bottom_nav_enabled', 'true', 'bottom_nav', 'বটম নেভিগেশন চালু/বন্ধ'),
  ('bottom_nav_hide_on_scroll', 'true', 'bottom_nav', 'স্ক্রলে হাইড করুন')
ON CONFLICT (key) DO NOTHING;
