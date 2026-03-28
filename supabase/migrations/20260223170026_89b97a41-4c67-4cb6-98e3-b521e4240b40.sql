
-- Add size-related columns to products
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS has_sizes boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS size_stock jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS has_size_chart boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS size_chart_type text DEFAULT null;

-- Create size_charts table for managing size chart data
CREATE TABLE IF NOT EXISTS public.size_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'shirt', 'pant', 'panjabi'
  name text NOT NULL, -- display name like 'Shirt Size Chart'
  columns text[] NOT NULL DEFAULT '{}', -- column headers like ['Size','Chest','Length','Sleeve','Collar']
  rows jsonb NOT NULL DEFAULT '[]'::jsonb, -- array of row data
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.size_charts ENABLE ROW LEVEL SECURITY;

-- RLS policies for size_charts
CREATE POLICY "Public read size_charts" ON public.size_charts FOR SELECT USING (true);
CREATE POLICY "Admin insert size_charts" ON public.size_charts FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update size_charts" ON public.size_charts FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete size_charts" ON public.size_charts FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to decrement stock when order is placed
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  item_id uuid;
  item_qty int;
  item_size text;
  product_record record;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    item_id := (item->>'id')::uuid;
    item_qty := COALESCE((item->>'quantity')::int, 1);
    item_size := item->>'size';
    
    SELECT has_sizes, size_stock, stock INTO product_record FROM products WHERE id = item_id;
    
    IF product_record.has_sizes AND item_size IS NOT NULL AND item_size != '' THEN
      -- Decrement size-specific stock
      UPDATE products 
      SET size_stock = jsonb_set(
        COALESCE(size_stock, '{}'::jsonb),
        ARRAY[item_size],
        to_jsonb(GREATEST(0, COALESCE((size_stock->>item_size)::int, 0) - item_qty))
      ),
      stock = GREATEST(0, stock - item_qty)
      WHERE id = item_id;
    ELSE
      -- Decrement general stock
      UPDATE products SET stock = GREATEST(0, stock - item_qty) WHERE id = item_id;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- Function to restore stock when order is cancelled
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  item_id uuid;
  item_qty int;
  item_size text;
  product_record record;
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      item_id := (item->>'id')::uuid;
      item_qty := COALESCE((item->>'quantity')::int, 1);
      item_size := item->>'size';
      
      SELECT has_sizes, size_stock INTO product_record FROM products WHERE id = item_id;
      
      IF product_record.has_sizes AND item_size IS NOT NULL AND item_size != '' THEN
        UPDATE products 
        SET size_stock = jsonb_set(
          COALESCE(size_stock, '{}'::jsonb),
          ARRAY[item_size],
          to_jsonb(COALESCE((size_stock->>item_size)::int, 0) + item_qty)
        ),
        stock = stock + item_qty
        WHERE id = item_id;
      ELSE
        UPDATE products SET stock = stock + item_qty WHERE id = item_id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trg_decrement_stock_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_stock_on_order();

CREATE TRIGGER trg_restore_stock_on_cancel
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_stock_on_cancel();

-- Enable realtime for products to show stock changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
