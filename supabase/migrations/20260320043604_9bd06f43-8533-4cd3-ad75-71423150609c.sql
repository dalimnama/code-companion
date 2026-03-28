INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true);

CREATE POLICY "Anyone can upload chat images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Anyone can read chat images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'chat-images');