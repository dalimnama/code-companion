
INSERT INTO public.site_settings (key, value, category, label) VALUES
  ('quickview_max_width', '92', 'quickview', 'পপআপ ম্যাক্স উইডথ (vw)'),
  ('quickview_max_height', '85', 'quickview', 'পপআপ ম্যাক্স হাইট (vh)'),
  ('quickview_image_ratio', '3/4', 'quickview', 'ইমেজ রেশিও'),
  ('quickview_border_radius', '16', 'quickview', 'পপআপ বর্ডার রেডিয়াস (px)'),
  ('quickview_image_radius', '12', 'quickview', 'ইমেজ বর্ডার রেডিয়াস (px)')
ON CONFLICT (key) DO NOTHING;
