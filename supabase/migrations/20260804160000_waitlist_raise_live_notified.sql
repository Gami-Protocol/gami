-- Track raise-live alert emails so waitlist members are only notified once.
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS raise_live_notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_waitlist_raise_live_notified
  ON public.waitlist (raise_live_notified_at)
  WHERE raise_live_notified_at IS NULL;
