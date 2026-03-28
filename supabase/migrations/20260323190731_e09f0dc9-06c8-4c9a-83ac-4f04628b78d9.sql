
-- Fix products.category_id foreign key to SET NULL on delete
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey 
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

-- Fix products.brand_id foreign key to SET NULL on delete
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_brand_id_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_brand_id_fkey 
  FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;

-- Fix product_reviews.product_id foreign key to CASCADE on delete
ALTER TABLE public.product_reviews DROP CONSTRAINT IF EXISTS product_reviews_product_id_fkey;
ALTER TABLE public.product_reviews ADD CONSTRAINT product_reviews_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Fix customer_events.product_id foreign key to SET NULL on delete
ALTER TABLE public.customer_events DROP CONSTRAINT IF EXISTS customer_events_product_id_fkey;
ALTER TABLE public.customer_events ADD CONSTRAINT customer_events_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
