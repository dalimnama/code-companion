INSERT INTO public.site_settings (key, value, label, category)
VALUES ('banner_overlay_opacity', '60', 'ব্যানার ওভারলে অপাসিটি', 'banner')
ON CONFLICT (key) DO NOTHING;