
-- Create site_settings table for managing all dynamic site configuration
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  label text,
  category text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert site_settings" ON public.site_settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow update site_settings" ON public.site_settings FOR UPDATE TO public USING (true);
CREATE POLICY "Allow delete site_settings" ON public.site_settings FOR DELETE TO public USING (true);

-- Insert default settings
INSERT INTO public.site_settings (key, value, label, category) VALUES
-- Payment
('bkash_number', '01840469120', 'bKash Number', 'payment'),
('nagad_number', '01840469120', 'Nagad Number', 'payment'),
-- Contact
('phone', '01840469120', 'Phone Number', 'contact'),
('email', 'dalim6663@gmail.com', 'Email Address', 'contact'),
('whatsapp', '8801840469120', 'WhatsApp Number', 'contact'),
('address', 'Dhaka, Bangladesh', 'Office Address', 'contact'),
('business_hours', 'Sat-Thu, 10:00 AM - 8:00 PM', 'Business Hours', 'contact'),
-- Social Media
('facebook_url', '', 'Facebook URL', 'social'),
('instagram_url', '', 'Instagram URL', 'social'),
('twitter_url', '', 'Twitter URL', 'social'),
('youtube_url', '', 'YouTube URL', 'social');
