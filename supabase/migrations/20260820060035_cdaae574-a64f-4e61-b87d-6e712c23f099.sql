ALTER TYPE public.sale_category ADD VALUE IF NOT EXISTS 'phone_software';

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_new_sim_airtime_check
  CHECK (category <> 'new_sim'::public.sale_category OR airtime > 0);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(btrim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_pair_idx ON public.messages (sender_id, recipient_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "users send own messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND recipient_id <> auth.uid());

CREATE POLICY "users delete own messages" ON public.messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE POLICY "team reads profile names" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "team reads roles for chat" ON public.user_roles
  FOR SELECT TO authenticated USING (true);