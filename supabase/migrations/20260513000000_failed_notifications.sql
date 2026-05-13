-- Track admin email send failures so operators know when a notification
-- was not delivered and can take manual action.
CREATE TABLE public.failed_notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient  text        NOT NULL,
  subject    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  retried_at timestamptz
);

-- Only the service role may read or write this table.
ALTER TABLE public.failed_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all" ON public.failed_notifications USING (false);
REVOKE ALL ON public.failed_notifications FROM anon, authenticated;
