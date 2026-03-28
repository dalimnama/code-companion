
-- Drop ALL existing policies on products and recreate as explicitly PERMISSIVE
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Allow insert products" ON public.products;
DROP POLICY IF EXISTS "Allow update products" ON public.products;
DROP POLICY IF EXISTS "Allow delete products" ON public.products;

CREATE POLICY "Public read products" ON public.products AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert products" ON public.products AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow update products" ON public.products AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY "Allow delete products" ON public.products AS PERMISSIVE FOR DELETE TO public USING (true);

-- Fix banners too
DROP POLICY IF EXISTS "Public read banners" ON public.banners;
DROP POLICY IF EXISTS "Allow insert banners" ON public.banners;
DROP POLICY IF EXISTS "Allow update banners" ON public.banners;
DROP POLICY IF EXISTS "Allow delete banners" ON public.banners;

CREATE POLICY "Public read banners" ON public.banners AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert banners" ON public.banners AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow update banners" ON public.banners AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY "Allow delete banners" ON public.banners AS PERMISSIVE FOR DELETE TO public USING (true);

-- Fix brands
DROP POLICY IF EXISTS "Public read brands" ON public.brands;
DROP POLICY IF EXISTS "Allow insert brands" ON public.brands;
DROP POLICY IF EXISTS "Allow update brands" ON public.brands;
DROP POLICY IF EXISTS "Allow delete brands" ON public.brands;

CREATE POLICY "Public read brands" ON public.brands AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert brands" ON public.brands AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow update brands" ON public.brands AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY "Allow delete brands" ON public.brands AS PERMISSIVE FOR DELETE TO public USING (true);

-- Fix categories
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow update categories" ON public.categories;
DROP POLICY IF EXISTS "Allow delete categories" ON public.categories;

CREATE POLICY "Public read categories" ON public.categories AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert categories" ON public.categories AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow update categories" ON public.categories AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY "Allow delete categories" ON public.categories AS PERMISSIVE FOR DELETE TO public USING (true);

-- Fix coupons
DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow delete coupons" ON public.coupons;

CREATE POLICY "Public read coupons" ON public.coupons AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert coupons" ON public.coupons AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow update coupons" ON public.coupons AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY "Allow delete coupons" ON public.coupons AS PERMISSIVE FOR DELETE TO public USING (true);

-- Fix orders
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow delete orders" ON public.orders;

CREATE POLICY "Public read orders" ON public.orders AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Public insert orders" ON public.orders AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow update orders" ON public.orders AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY "Allow delete orders" ON public.orders AS PERMISSIVE FOR DELETE TO public USING (true);
