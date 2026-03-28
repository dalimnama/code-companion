
-- Remove the overly permissive public SELECT policy on orders
DROP POLICY IF EXISTS "Public track order by order_id" ON public.orders;

-- Create a secure function for order tracking (returns only the specific order)
CREATE OR REPLACE FUNCTION public.track_order(_order_id text)
RETURNS TABLE (
  order_id text,
  customer_name text,
  customer_phone text,
  customer_email text,
  address text,
  area text,
  city text,
  shipping_method text,
  shipping_cost numeric,
  payment_method text,
  transaction_id text,
  notes text,
  subtotal numeric,
  discount_amount numeric,
  total numeric,
  status text,
  items json,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.order_id, o.customer_name, o.customer_phone, o.customer_email,
    o.address, o.area, o.city, o.shipping_method, o.shipping_cost,
    o.payment_method, o.transaction_id, o.notes, o.subtotal,
    o.discount_amount, o.total, o.status, o.items::json, o.created_at
  FROM public.orders o
  WHERE o.order_id = _order_id
  LIMIT 1;
$$;
