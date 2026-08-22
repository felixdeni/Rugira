CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image','video')),
  product_link text,
  description text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read posts" ON public.posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "boss creates posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND public.has_role(auth.uid(), 'boss'));
CREATE POLICY "boss updates posts" ON public.posts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'boss')) WITH CHECK (public.has_role(auth.uid(), 'boss'));
CREATE POLICY "boss deletes posts" ON public.posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'boss'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;