
CREATE TABLE public.visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'direct',
  referrer_url TEXT,
  page_url TEXT,
  country TEXT,
  division TEXT,
  district TEXT,
  city TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Public insert for tracking
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert visitors" ON public.visitors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin read visitors" ON public.visitors
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete visitors" ON public.visitors
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for analytics queries
CREATE INDEX idx_visitors_created_at ON public.visitors (created_at);
CREATE INDEX idx_visitors_source ON public.visitors (source);
