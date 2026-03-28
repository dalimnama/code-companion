
-- Create announcement_items table for managing scrolling announcement bar content
CREATE TABLE public.announcement_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  content_bn text,
  link text,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcement_items ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read announcement_items" ON public.announcement_items AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert announcement_items" ON public.announcement_items AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow update announcement_items" ON public.announcement_items AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY "Allow delete announcement_items" ON public.announcement_items AS PERMISSIVE FOR DELETE TO public USING (true);

-- Insert default announcement
INSERT INTO public.announcement_items (content, content_bn, sort_order) VALUES
('All our products are available on Cash on Delivery. Call us at 01840469120', 'আমাদের সকল পন্য ক্যাশ অন ডেলিভারিতে পেয়ে যাবেন, যেকোনো প্রয়োজনে কল করুন 01840469120', 1);
