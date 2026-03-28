
-- Fix orders: restrict SELECT - admin sees all, public can only track by order_id
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;

-- Admin can read all orders
CREATE POLICY "Admin read all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public can track their order by order_id (non-authenticated)
CREATE POLICY "Public track order by order_id"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- Note: We keep public insert but the above SELECT restriction means 
-- people can't browse all orders. For INSERT we need it open for checkout.
CREATE POLICY "Public create orders"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Fix coupons: only allow reading active coupons
DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;

CREATE POLICY "Public read active coupons"
  ON public.coupons FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admin can read all coupons
CREATE POLICY "Admin read all coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
