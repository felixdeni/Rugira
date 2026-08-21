ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text,
  ADD COLUMN IF NOT EXISTS duration_seconds numeric;

ALTER TABLE public.messages ALTER COLUMN body SET DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_body_or_media'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_body_or_media
      CHECK (length(coalesce(body, '')) > 0 OR media_url IS NOT NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END $$;

ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;