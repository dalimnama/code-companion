
-- Add pant size columns to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_pant_sizes boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pant_size_stock jsonb DEFAULT '{}'::jsonb;

-- Recreate decrement_stock_on_order to handle pant sizes
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    
    SELECT has_sizes, size_stock, stock, has_pant_sizes, pant_size_stock INTO product_record FROM products WHERE id = item_id;
    
    IF product_record.has_sizes AND item_size IS NOT NULL AND item_size != '' THEN
      UPDATE products 
      SET size_stock = jsonb_set(
        COALESCE(size_stock, '{}'::jsonb),
        ARRAY[item_size],
        to_jsonb(GREATEST(0, COALESCE((size_stock->>item_size)::int, 0) - item_qty))
      ),
      stock = GREATEST(0, stock - item_qty)
      WHERE id = item_id;
    ELSIF product_record.has_pant_sizes AND item_size IS NOT NULL AND item_size != '' THEN
      UPDATE products 
      SET pant_size_stock = jsonb_set(
        COALESCE(pant_size_stock, '{}'::jsonb),
        ARRAY[item_size],
        to_jsonb(GREATEST(0, COALESCE((pant_size_stock->>item_size)::int, 0) - item_qty))
      ),
      stock = GREATEST(0, stock - item_qty)
      WHERE id = item_id;
    ELSE
      UPDATE products SET stock = GREATEST(0, stock - item_qty) WHERE id = item_id;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$function$;

-- Recreate restore_stock_on_cancel to handle pant sizes
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      
      SELECT has_sizes, size_stock, has_pant_sizes, pant_size_stock INTO product_record FROM products WHERE id = item_id;
      
      IF product_record.has_sizes AND item_size IS NOT NULL AND item_size != '' THEN
        UPDATE products 
        SET size_stock = jsonb_set(
          COALESCE(size_stock, '{}'::jsonb),
          ARRAY[item_size],
          to_jsonb(COALESCE((size_stock->>item_size)::int, 0) + item_qty)
        ),
        stock = stock + item_qty
        WHERE id = item_id;
      ELSIF product_record.has_pant_sizes AND item_size IS NOT NULL AND item_size != '' THEN
        UPDATE products 
        SET pant_size_stock = jsonb_set(
          COALESCE(pant_size_stock, '{}'::jsonb),
          ARRAY[item_size],
          to_jsonb(COALESCE((pant_size_stock->>item_size)::int, 0) + item_qty)
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
$function$;
