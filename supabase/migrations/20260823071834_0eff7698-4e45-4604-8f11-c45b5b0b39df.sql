CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

-- profiles
DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
USING ((id = auth.uid()) OR private.has_role(auth.uid(), 'boss'));

-- user_roles
DROP POLICY IF EXISTS "own roles read" ON public.user_roles;
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'boss'));

-- transactions
DROP POLICY IF EXISTS "employee reads own sales" ON public.transactions;
CREATE POLICY "employee reads own sales" ON public.transactions FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR private.has_role(auth.uid(), 'boss'));

DROP POLICY IF EXISTS "employee records today sales" ON public.transactions;
CREATE POLICY "employee records today sales" ON public.transactions FOR INSERT TO authenticated
WITH CHECK ((user_id = auth.uid()) AND private.has_role(auth.uid(), 'employee') AND (sale_date = CURRENT_DATE));

-- posts
DROP POLICY IF EXISTS "boss creates posts" ON public.posts;
CREATE POLICY "boss creates posts" ON public.posts FOR INSERT TO authenticated
WITH CHECK ((author_id = auth.uid()) AND private.has_role(auth.uid(), 'boss'));

DROP POLICY IF EXISTS "boss updates posts" ON public.posts;
CREATE POLICY "boss updates posts" ON public.posts FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'boss')) WITH CHECK (private.has_role(auth.uid(), 'boss'));

DROP POLICY IF EXISTS "boss deletes posts" ON public.posts;
CREATE POLICY "boss deletes posts" ON public.posts FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'boss'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- storage policies for post-media
DROP POLICY IF EXISTS "post media public read" ON storage.objects;
CREATE POLICY "post media public read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'post-media');

DROP POLICY IF EXISTS "post media boss upload" ON storage.objects;
CREATE POLICY "post media boss upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-media' AND private.has_role(auth.uid(), 'boss'));

DROP POLICY IF EXISTS "post media boss update" ON storage.objects;
CREATE POLICY "post media boss update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'post-media' AND private.has_role(auth.uid(), 'boss'))
WITH CHECK (bucket_id = 'post-media' AND private.has_role(auth.uid(), 'boss'));

DROP POLICY IF EXISTS "post media boss delete" ON storage.objects;
CREATE POLICY "post media boss delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-media' AND private.has_role(auth.uid(), 'boss'));