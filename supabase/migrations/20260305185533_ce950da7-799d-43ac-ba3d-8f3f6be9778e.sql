INSERT INTO public.site_settings (key, value, category, label) VALUES
  ('footer_copyright_active', 'true', 'footer', 'কপিরাইট বার দেখান'),
  ('footer_copyright_height', '40', 'footer', 'কপিরাইট বার হাইট'),
  ('footer_copyright_padding_x', '20', 'footer', 'কপিরাইট বার প্যাডিং (X)'),
  ('footer_copyright_padding_y', '8', 'footer', 'কপিরাইট বার প্যাডিং (Y)'),
  ('footer_copyright_radius', '9999', 'footer', 'কপিরাইট বার রেডিয়াস'),
  ('footer_copyright_border_width', '1', 'footer', 'কপিরাইট বর্ডার প্রস্থ'),
  ('footer_copyright_border_color', 'primary', 'footer', 'কপিরাইট বর্ডার কালার'),
  ('footer_copyright_bg_opacity', '5', 'footer', 'কপিরাইট ব্যাকগ্রাউন্ড অপাসিটি'),
  ('footer_copyright_font_size', '12', 'footer', 'কপিরাইট ফন্ট সাইজ')
ON CONFLICT (key) DO NOTHING;