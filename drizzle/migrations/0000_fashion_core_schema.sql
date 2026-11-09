
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  owner_name text NOT NULL,
  phone text,
  email text,
  currency text NOT NULL DEFAULT 'NGN',
  measurement_unit text NOT NULL DEFAULT 'cm' CHECK (measurement_unit IN ('cm','in')),
  logo_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner all" ON public.businesses FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE OR REPLACE FUNCTION public.owns_business(_bid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.businesses WHERE id = _bid AND owner_id = auth.uid())
$$;

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text, email text, address text, notes text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.customers(business_id);

CREATE TABLE public.measurement_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.measurement_templates(business_id);

CREATE TABLE public.measurement_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.measurement_templates(id) ON DELETE CASCADE,
  label text NOT NULL,
  position int NOT NULL DEFAULT 0
);
CREATE INDEX ON public.measurement_fields(template_id);

CREATE TABLE public.customer_measurement_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.measurement_templates(id) ON DELETE SET NULL,
  garment text NOT NULL,
  unit text NOT NULL DEFAULT 'cm' CHECK (unit IN ('cm','in')),
  taken_on date NOT NULL DEFAULT current_date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.customer_measurement_sets(customer_id);

CREATE TABLE public.customer_measurement_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  set_id uuid NOT NULL REFERENCES public.customer_measurement_sets(id) ON DELETE CASCADE,
  label text NOT NULL,
  value numeric(8,2) NOT NULL,
  position int NOT NULL DEFAULT 0
);
CREATE INDEX ON public.customer_measurement_values(set_id);

CREATE TABLE public.style_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.style_collections(business_id);

CREATE TABLE public.style_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  description text,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  width int, height int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.style_assets(business_id);

CREATE TABLE public.collection_assets (
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES public.style_collections(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.style_assets(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, asset_id)
);

CREATE TABLE public.customer_style_assets (
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.style_assets(id) ON DELETE CASCADE,
  PRIMARY KEY (customer_id, asset_id)
);

CREATE TYPE public.order_status AS ENUM ('pending','cutting','sewing','fitting','finishing','ready','delivered','cancelled');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  outfit_name text NOT NULL,
  description text,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price numeric(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  due_date date,
  status public.order_status NOT NULL DEFAULT 'pending',
  production_notes text,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.orders(business_id, status);
CREATE INDEX ON public.orders(customer_id);

CREATE TABLE public.order_style_assets (
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.style_assets(id) ON DELETE CASCADE,
  PRIMARY KEY (order_id, asset_id)
);

CREATE TABLE public.order_measurement_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  source_set_id uuid,
  garment text NOT NULL,
  unit text NOT NULL,
  values jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.order_measurement_snapshots(order_id);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  method text NOT NULL DEFAULT 'cash',
  paid_on date NOT NULL DEFAULT current_date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.payments(business_id, paid_on);
CREATE INDEX ON public.payments(order_id);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'fitting',
  starts_at timestamptz NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.appointments(business_id, starts_at);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.audit_logs(business_id, created_at DESC);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers','measurement_templates','measurement_fields','customer_measurement_sets','customer_measurement_values','style_collections','style_assets','collection_assets','customer_style_assets','orders','order_style_assets','order_measurement_snapshots','appointments'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "business scoped" ON public.%I FOR ALL TO authenticated USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id))', t);
  END LOOP;
END $$;

GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business read" ON public.payments FOR SELECT TO authenticated USING (public.owns_business(business_id));
CREATE POLICY "business insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.owns_business(business_id));

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business read" ON public.audit_logs FOR SELECT TO authenticated USING (public.owns_business(business_id));
CREATE POLICY "business insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.owns_business(business_id));

CREATE VIEW public.order_balances WITH (security_invoker = true) AS
SELECT o.id AS order_id, o.business_id, o.price,
  COALESCE(SUM(p.amount), 0)::numeric(14,2) AS paid,
  (o.price - COALESCE(SUM(p.amount), 0))::numeric(14,2) AS balance,
  CASE WHEN COALESCE(SUM(p.amount),0) = 0 AND o.price > 0 THEN 'unpaid'
       WHEN COALESCE(SUM(p.amount),0) < o.price THEN 'partial'
       WHEN COALESCE(SUM(p.amount),0) = o.price THEN 'paid'
       ELSE 'overpaid' END AS payment_status
FROM public.orders o LEFT JOIN public.payments p ON p.order_id = o.id
GROUP BY o.id;
GRANT SELECT ON public.order_balances TO authenticated;

CREATE POLICY "style read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'style-assets' AND public.owns_business(((storage.foldername(name))[1])::uuid));
CREATE POLICY "style insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'style-assets' AND public.owns_business(((storage.foldername(name))[1])::uuid));
CREATE POLICY "style update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'style-assets' AND public.owns_business(((storage.foldername(name))[1])::uuid));
CREATE POLICY "style delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'style-assets' AND public.owns_business(((storage.foldername(name))[1])::uuid));
