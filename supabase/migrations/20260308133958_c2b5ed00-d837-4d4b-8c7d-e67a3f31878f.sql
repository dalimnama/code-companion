INSERT INTO public.site_settings (key, value, category, label) VALUES
  ('order_btn_height', '40', 'order_button', 'বাটন হাইট (px)'),
  ('order_btn_border_width', '2', 'order_button', 'বর্ডার উইডথ (px)'),
  ('order_btn_border_radius', '8', 'order_button', 'বর্ডার রেডিয়াস (px)'),
  ('order_btn_font_size', '14', 'order_button', 'ফন্ট সাইজ (px)'),
  ('order_btn_border_color', 'foreground', 'order_button', 'বর্ডার কালার')
ON CONFLICT (key) DO NOTHING;