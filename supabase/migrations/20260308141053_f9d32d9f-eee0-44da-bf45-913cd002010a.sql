
INSERT INTO public.site_settings (key, value, category, label)
VALUES
  ('quickview_close_size', '32', 'quickview', 'Close Button Size'),
  ('quickview_close_icon_size', '16', 'quickview', 'Close Icon Size'),
  ('quickview_close_border_width', '1', 'quickview', 'Close Border Width'),
  ('quickview_close_border_radius', '50', 'quickview', 'Close Border Radius'),
  ('quickview_close_bg', 'background', 'quickview', 'Close BG Color Token'),
  ('quickview_close_opacity', '80', 'quickview', 'Close BG Opacity %')
ON CONFLICT (key) DO NOTHING;
