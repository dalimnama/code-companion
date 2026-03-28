
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews
CREATE POLICY "Public read approved reviews" ON public.product_reviews
  FOR SELECT USING (is_approved = true);

-- Anyone can submit a review
CREATE POLICY "Public insert reviews" ON public.product_reviews
  FOR INSERT WITH CHECK (true);

-- Admin can read all reviews
CREATE POLICY "Admin read all reviews" ON public.product_reviews
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update reviews (approve/reject)
CREATE POLICY "Admin update reviews" ON public.product_reviews
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete reviews
CREATE POLICY "Admin delete reviews" ON public.product_reviews
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
