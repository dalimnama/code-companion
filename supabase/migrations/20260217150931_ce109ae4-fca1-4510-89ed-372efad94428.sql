
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE for all tables

-- Products
DROP POLICY IF EXISTS "Allow delete products" ON public.products;
DROP POLICY IF EXISTS "Allow insert products" ON public.products;
DROP POLICY IF EXISTS "Allow update products" ON public.products;
DROP POLICY IF EXISTS "Public read products" ON public.products;

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow delete products" ON public.products FOR DELETE USING (true);

-- Banners
DROP POLICY IF EXISTS "Allow delete banners" ON public.banners;
DROP POLICY IF EXISTS "Allow insert banners" ON public.banners;
DROP POLICY IF EXISTS "Allow update banners" ON public.banners;
DROP POLICY IF EXISTS "Public read banners" ON public.banners;

CREATE POLICY "Public read banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Allow insert banners" ON public.banners FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update banners" ON public.banners FOR UPDATE USING (true);
CREATE POLICY "Allow delete banners" ON public.banners FOR DELETE USING (true);

-- Brands
DROP POLICY IF EXISTS "Allow delete brands" ON public.brands;
DROP POLICY IF EXISTS "Allow insert brands" ON public.brands;
DROP POLICY IF EXISTS "Allow update brands" ON public.brands;
DROP POLICY IF EXISTS "Public read brands" ON public.brands;

CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Allow insert brands" ON public.brands FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update brands" ON public.brands FOR UPDATE USING (true);
CREATE POLICY "Allow delete brands" ON public.brands FOR DELETE USING (true);

-- Categories
DROP POLICY IF EXISTS "Allow delete categories" ON public.categories;
DROP POLICY IF EXISTS "Allow insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow update categories" ON public.categories;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;

CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow insert categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Allow delete categories" ON public.categories FOR DELETE USING (true);

-- Coupons
DROP POLICY IF EXISTS "Allow delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;

CREATE POLICY "Public read coupons" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Allow insert coupons" ON public.coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update coupons" ON public.coupons FOR UPDATE USING (true);
CREATE POLICY "Allow delete coupons" ON public.coupons FOR DELETE USING (true);

-- Orders
DROP POLICY IF EXISTS "Allow delete orders" ON public.orders;
DROP POLICY IF EXISTS "Allow update orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;

CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow delete orders" ON public.orders FOR DELETE USING (true);
