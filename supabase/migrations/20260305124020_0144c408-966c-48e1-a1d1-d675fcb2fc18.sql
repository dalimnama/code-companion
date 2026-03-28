INSERT INTO public.site_settings (key, value, label, category)
VALUES ('banner_progress_bar', 'true', 'ব্যানার প্রগ্রেস বার', 'banner')
ON CONFLICT (key) DO NOTHING;