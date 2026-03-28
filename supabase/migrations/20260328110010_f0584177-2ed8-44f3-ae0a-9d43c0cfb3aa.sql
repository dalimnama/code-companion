
-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  price NUMERIC NOT NULL,
  compare_at_price NUMERIC,
  sku TEXT,
  stock INT NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  rating_avg NUMERIC DEFAULT 0,
  rating_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_flash_sale BOOLEAN DEFAULT false,
  flash_sale_end TIMESTAMPTZ,
  specifications JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_super BOOLEAN DEFAULT false,
  is_mega BOOLEAN DEFAULT false,
  has_sizes BOOLEAN NOT NULL DEFAULT false,
  size_stock JSONB DEFAULT '{}'::jsonb,
  has_size_chart BOOLEAN NOT NULL DEFAULT false,
  size_chart_type TEXT DEFAULT null,
  has_pant_sizes BOOLEAN NOT NULL DEFAULT false,
  pant_size_stock JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Banners table
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image TEXT NOT NULL,
  link TEXT,
  cta_text TEXT,
  cta_text_bn TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'percent',
  value NUMERIC NOT NULL,
  min_spend NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  address TEXT NOT NULL,
  area TEXT,
  city TEXT,
  shipping_method TEXT NOT NULL,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  notes TEXT,
  subtotal NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  coupon_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcement items table
CREATE TABLE public.announcement_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  content_bn TEXT,
  link TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Site settings table
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  label TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- App role enum and user_roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Visitors table
CREATE TABLE public.visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'direct',
  referrer_url TEXT,
  page_url TEXT,
  country TEXT,
  division TEXT,
  district TEXT,
  city TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Size charts table
CREATE TABLE public.size_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  columns TEXT[] NOT NULL DEFAULT '{}',
  rows JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer events table
CREATE TABLE public.customer_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_title TEXT,
  product_price NUMERIC,
  product_size TEXT,
  quantity INTEGER DEFAULT 1,
  customer_phone TEXT,
  customer_name TEXT,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Public read policies
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Public read announcement_items" ON public.announcement_items FOR SELECT USING (true);
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public read size_charts" ON public.size_charts FOR SELECT USING (true);
CREATE POLICY "Public read approved reviews" ON public.product_reviews FOR SELECT USING (is_approved = true);

-- Admin read policies
CREATE POLICY "Admin read all coupons" ON public.coupons FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin read all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin read visitors" ON public.visitors FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin read customer_events" ON public.customer_events FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin read all reviews" ON public.product_reviews FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read user_roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Public insert policies
CREATE POLICY "Public create orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public insert visitors" ON public.visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert customer_events" ON public.customer_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);

-- Profile policies
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admin write policies for products
CREATE POLICY "Admin insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin write policies for categories
CREATE POLICY "Admin insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin write policies for brands
CREATE POLICY "Admin insert brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update brands" ON public.brands FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete brands" ON public.brands FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin write policies for banners
CREATE POLICY "Admin insert banners" ON public.banners FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update banners" ON public.banners FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete banners" ON public.banners FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin write policies for coupons
CREATE POLICY "Admin insert coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update coupons" ON public.coupons FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete coupons" ON public.coupons FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin write policies for orders
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin write policies for announcement_items
CREATE POLICY "Admin insert announcement_items" ON public.announcement_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update announcement_items" ON public.announcement_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete announcement_items" ON public.announcement_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin write policies for site_settings
CREATE POLICY "Admin insert site_settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update site_settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete site_settings" ON public.site_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin write policies for other tables
CREATE POLICY "Admin delete visitors" ON public.visitors FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete customer_events" ON public.customer_events FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin insert size_charts" ON public.size_charts FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update size_charts" ON public.size_charts FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete size_charts" ON public.size_charts FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert user_roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete user_roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update reviews" ON public.product_reviews FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete reviews" ON public.product_reviews FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_brand ON public.products(brand_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_visitors_created_at ON public.visitors(created_at);
CREATE INDEX idx_visitors_source ON public.visitors(source);
CREATE INDEX idx_customer_events_type ON public.customer_events(event_type);
CREATE INDEX idx_customer_events_created ON public.customer_events(created_at DESC);
CREATE INDEX idx_customer_events_product ON public.customer_events(product_id);

-- Track order function
CREATE OR REPLACE FUNCTION public.track_order(_order_id text)
RETURNS TABLE (
  order_id text, customer_name text, customer_phone text, customer_email text,
  address text, area text, city text, shipping_method text, shipping_cost numeric,
  payment_method text, transaction_id text, notes text, subtotal numeric,
  discount_amount numeric, total numeric, status text, items json, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT o.order_id, o.customer_name, o.customer_phone, o.customer_email, o.address, o.area, o.city, o.shipping_method, o.shipping_cost, o.payment_method, o.transaction_id, o.notes, o.subtotal, o.discount_amount, o.total, o.status, o.items::json, o.created_at FROM public.orders o WHERE o.order_id = _order_id LIMIT 1; $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''), COALESCE(NEW.email, ''));
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Stock management
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE item jsonb; item_id uuid; item_qty int; item_size text; product_record record;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
    item_id := (item->>'id')::uuid; item_qty := COALESCE((item->>'quantity')::int, 1); item_size := item->>'size';
    SELECT has_sizes, size_stock, stock, has_pant_sizes, pant_size_stock INTO product_record FROM products WHERE id = item_id;
    IF product_record.has_sizes AND item_size IS NOT NULL AND item_size != '' THEN
      UPDATE products SET size_stock = jsonb_set(COALESCE(size_stock, '{}'::jsonb), ARRAY[item_size], to_jsonb(GREATEST(0, COALESCE((size_stock->>item_size)::int, 0) - item_qty))), stock = GREATEST(0, stock - item_qty) WHERE id = item_id;
    ELSIF product_record.has_pant_sizes AND item_size IS NOT NULL AND item_size != '' THEN
      UPDATE products SET pant_size_stock = jsonb_set(COALESCE(pant_size_stock, '{}'::jsonb), ARRAY[item_size], to_jsonb(GREATEST(0, COALESCE((pant_size_stock->>item_size)::int, 0) - item_qty))), stock = GREATEST(0, stock - item_qty) WHERE id = item_id;
    ELSE
      UPDATE products SET stock = GREATEST(0, stock - item_qty) WHERE id = item_id;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE item jsonb; item_id uuid; item_qty int; item_size text; product_record record;
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
      item_id := (item->>'id')::uuid; item_qty := COALESCE((item->>'quantity')::int, 1); item_size := item->>'size';
      SELECT has_sizes, size_stock, has_pant_sizes, pant_size_stock INTO product_record FROM products WHERE id = item_id;
      IF product_record.has_sizes AND item_size IS NOT NULL AND item_size != '' THEN
        UPDATE products SET size_stock = jsonb_set(COALESCE(size_stock, '{}'::jsonb), ARRAY[item_size], to_jsonb(COALESCE((size_stock->>item_size)::int, 0) + item_qty)), stock = stock + item_qty WHERE id = item_id;
      ELSIF product_record.has_pant_sizes AND item_size IS NOT NULL AND item_size != '' THEN
        UPDATE products SET pant_size_stock = jsonb_set(COALESCE(pant_size_stock, '{}'::jsonb), ARRAY[item_size], to_jsonb(COALESCE((pant_size_stock->>item_size)::int, 0) + item_qty)), stock = stock + item_qty WHERE id = item_id;
      ELSE
        UPDATE products SET stock = stock + item_qty WHERE id = item_id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_decrement_stock_on_order AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_order();
CREATE TRIGGER trg_restore_stock_on_cancel AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_cancel();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_reviews;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload chat images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'chat-images');
CREATE POLICY "Anyone can read chat images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'chat-images');

-- Default data
INSERT INTO public.announcement_items (content, content_bn, sort_order) VALUES ('All our products are available on Cash on Delivery', 'আমাদের সকল পন্য ক্যাশ অন ডেলিভারিতে পাওয়া যায়', 1);

INSERT INTO public.site_settings (key, value, label, category) VALUES
('bkash_number', '01840469120', 'bKash Number', 'payment'),
('nagad_number', '01840469120', 'Nagad Number', 'payment'),
('phone', '01840469120', 'Phone Number', 'contact'),
('email', 'dalim6663@gmail.com', 'Email Address', 'contact'),
('whatsapp', '8801840469120', 'WhatsApp Number', 'contact'),
('address', 'Dhaka, Bangladesh', 'Office Address', 'contact'),
('business_hours', 'Sat-Thu, 10:00 AM - 8:00 PM', 'Business Hours', 'contact'),
('facebook_url', '', 'Facebook URL', 'social'),
('instagram_url', '', 'Instagram URL', 'social'),
('logo_height', '40', 'Logo Height', 'logo')
ON CONFLICT (key) DO NOTHING;
