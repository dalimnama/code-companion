
CREATE TABLE public.customer_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_title text,
  product_price numeric,
  product_size text,
  quantity integer DEFAULT 1,
  customer_phone text,
  customer_name text,
  session_id text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read customer_events" ON public.customer_events
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public insert customer_events" ON public.customer_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin delete customer_events" ON public.customer_events
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_customer_events_type ON public.customer_events(event_type);
CREATE INDEX idx_customer_events_created ON public.customer_events(created_at DESC);
CREATE INDEX idx_customer_events_product ON public.customer_events(product_id);
