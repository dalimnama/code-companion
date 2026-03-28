
-- Fix banners: drop restrictive, add permissive policies
DROP POLICY IF EXISTS "Public read banners" ON public.banners;
CREATE POLICY "Public read banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Allow insert banners" ON public.banners FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update banners" ON public.banners FOR UPDATE USING (true);
CREATE POLICY "Allow delete banners" ON public.banners FOR DELETE USING (true);

-- Fix brands
DROP POLICY IF EXISTS "Public read brands" ON public.brands;
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Allow insert brands" ON public.brands FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update brands" ON public.brands FOR UPDATE USING (true);
CREATE POLICY "Allow delete brands" ON public.brands FOR DELETE USING (true);

-- Fix categories
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow insert categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Allow delete categories" ON public.categories FOR DELETE USING (true);

-- Fix coupons
DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;
CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Allow insert coupons" ON public.coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update coupons" ON public.coupons FOR UPDATE USING (true);
CREATE POLICY "Allow delete coupons" ON public.coupons FOR DELETE USING (true);

-- Fix products
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow delete products" ON public.products FOR DELETE USING (true);

-- Fix orders
DROP POLICY IF EXISTS "Anyone can place orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can read orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow delete orders" ON public.orders FOR DELETE USING (true);
