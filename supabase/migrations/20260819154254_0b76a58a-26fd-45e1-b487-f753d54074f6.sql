CREATE TYPE public.app_role AS ENUM ('employee','boss');
CREATE TYPE public.sale_category AS ENUM ('new_sim','sim_swap','movies_songs');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'boss'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'boss'));

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.sale_category NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  airtime NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (airtime >= 0),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  gross NUMERIC(14,2) GENERATED ALWAYS AS (quantity * price) STORED,
  net NUMERIC(14,2) GENERATED ALWAYS AS (
    CASE WHEN category = 'new_sim' THEN (quantity * price) - airtime ELSE (quantity * price) END
  ) STORED,
  employee_amount NUMERIC(14,2) GENERATED ALWAYS AS (
    ROUND((CASE WHEN category = 'new_sim' THEN (quantity * price) - airtime ELSE (quantity * price) END) * 0.40, 2)
  ) STORED,
  boss_amount NUMERIC(14,2) GENERATED ALWAYS AS (
    ROUND((CASE WHEN category = 'new_sim' THEN (quantity * price) - airtime ELSE (quantity * price) END) * 0.60, 2)
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX transactions_sale_date_idx ON public.transactions (sale_date);
CREATE INDEX transactions_user_idx ON public.transactions (user_id);

GRANT SELECT, INSERT, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee reads own sales" ON public.transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'boss'));

CREATE POLICY "employee records today sales" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.has_role(auth.uid(),'employee')
    AND sale_date = CURRENT_DATE
  );

CREATE POLICY "employee deletes own today sales" ON public.transactions FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND sale_date = CURRENT_DATE);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'employee'))
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();