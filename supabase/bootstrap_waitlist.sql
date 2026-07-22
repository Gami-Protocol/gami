-- =============================================================================
-- Gami Protocol — canonical waitlist schema (fresh-project safe)
-- Project: xetqhdzvbfeiedbmopew
--
-- Apply in Supabase Dashboard → SQL Editor → New query → Run
-- OR:  psql "$DATABASE_URL" -f supabase/bootstrap_waitlist.sql
--
-- After running: Dashboard → Settings → API → Reload schema (or wait ~10s)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Core waitlist table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  role TEXT,
  country TEXT,
  interests TEXT,
  wallet_address TEXT,
  referral_code TEXT,
  referred_by TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_email_unique UNIQUE (email)
);

-- Idempotent column adds (safe if an older partial table already exists)
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS interests TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.waitlist DROP CONSTRAINT IF EXISTS waitlist_status_check;
ALTER TABLE public.waitlist
  ADD CONSTRAINT waitlist_status_check
  CHECK (
    status IS NULL
    OR status IN (
      'pending',
      'registered',
      'wallet_linked',
      'kyc_pending',
      'eligible',
      'distributed'
    )
  );

UPDATE public.waitlist
SET status = 'pending'
WHERE status IS NULL OR btrim(status) = '';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_referral_code_unique
  ON public.waitlist (referral_code)
  WHERE referral_code IS NOT NULL AND referral_code <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_wallet_unique
  ON public.waitlist (wallet_address)
  WHERE wallet_address IS NOT NULL AND wallet_address <> '';

CREATE INDEX IF NOT EXISTS idx_waitlist_referred_by ON public.waitlist (referred_by);
CREATE INDEX IF NOT EXISTS idx_waitlist_company ON public.waitlist (company);
CREATE INDEX IF NOT EXISTS idx_waitlist_source ON public.waitlist (source);
CREATE INDEX IF NOT EXISTS idx_waitlist_wallet ON public.waitlist (wallet_address);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.waitlist (status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist (created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist (email);

-- ---------------------------------------------------------------------------
-- Normalize + generate GAMI-XXXXXX invite codes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_waitlist_row()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT;
  i INT;
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;

  IF NEW.full_name IS NOT NULL THEN
    NEW.full_name := nullif(trim(NEW.full_name), '');
  END IF;

  IF NEW.company IS NOT NULL THEN
    NEW.company := nullif(trim(NEW.company), '');
  END IF;

  IF NEW.role IS NOT NULL THEN
    NEW.role := nullif(trim(NEW.role), '');
  END IF;

  IF NEW.country IS NOT NULL THEN
    NEW.country := nullif(trim(NEW.country), '');
  END IF;

  IF NEW.interests IS NOT NULL THEN
    NEW.interests := nullif(trim(NEW.interests), '');
  END IF;

  IF NEW.source IS NOT NULL THEN
    NEW.source := nullif(trim(NEW.source), '');
  END IF;

  IF NEW.referred_by IS NOT NULL THEN
    NEW.referred_by := upper(nullif(trim(NEW.referred_by), ''));
  END IF;

  IF NEW.wallet_address IS NOT NULL THEN
    NEW.wallet_address := nullif(lower(trim(NEW.wallet_address)), '');
  END IF;

  IF NEW.wallet_address IS NOT NULL THEN
    NEW.status := 'wallet_linked';
  ELSIF NEW.status IS NULL OR btrim(NEW.status) = '' OR NEW.status = 'registered' THEN
    NEW.status := 'pending';
  END IF;

  IF NEW.referral_code IS NULL OR btrim(NEW.referral_code) = '' THEN
    LOOP
      code := 'GAMI-';
      FOR i IN 1..6 LOOP
        code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.waitlist w WHERE w.referral_code = code
      );
    END LOOP;
    NEW.referral_code := code;
  ELSE
    NEW.referral_code := upper(trim(NEW.referral_code));
  END IF;

  NEW.updated_at := now();
  IF NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_waitlist_row ON public.waitlist;
CREATE TRIGGER trg_normalize_waitlist_row
  BEFORE INSERT OR UPDATE ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_waitlist_row();

-- ---------------------------------------------------------------------------
-- Optional email-alert subscribers (ops)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.waitlist_alert_subscribers (
  email TEXT PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist_alert_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS waitlist_alert_subscribers_insert ON public.waitlist_alert_subscribers;
DROP POLICY IF EXISTS waitlist_alert_subscribers_update ON public.waitlist_alert_subscribers;

CREATE POLICY waitlist_alert_subscribers_insert
  ON public.waitlist_alert_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND length(email) >= 5);

CREATE POLICY waitlist_alert_subscribers_update
  ON public.waitlist_alert_subscribers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- RLS: public INSERT only (no public SELECT/UPDATE/DELETE of PII)
-- ---------------------------------------------------------------------------
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS waitlist_insert ON public.waitlist;
DROP POLICY IF EXISTS waitlist_select_own ON public.waitlist;
DROP POLICY IF EXISTS waitlist_anon_insert ON public.waitlist;
DROP POLICY IF EXISTS waitlist_anon_select ON public.waitlist;
DROP POLICY IF EXISTS waitlist_anon_update ON public.waitlist;
DROP POLICY IF EXISTS waitlist_anon_delete ON public.waitlist;

CREATE POLICY waitlist_anon_insert
  ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) >= 5
    AND length(email) <= 254
  );

-- ---------------------------------------------------------------------------
-- Privileges (required in addition to RLS)
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT INSERT ON TABLE public.waitlist TO anon, authenticated;
GRANT ALL ON TABLE public.waitlist TO service_role;

GRANT INSERT, UPDATE ON TABLE public.waitlist_alert_subscribers TO anon, authenticated;
GRANT ALL ON TABLE public.waitlist_alert_subscribers TO service_role;

-- ---------------------------------------------------------------------------
-- Public count RPC (no PII)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.waitlist_public_count()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::BIGINT FROM public.waitlist;
$$;

REVOKE ALL ON FUNCTION public.waitlist_public_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.waitlist_public_count() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.waitlist_distribution AS
SELECT
  id,
  email,
  full_name,
  wallet_address,
  referral_code,
  referred_by,
  source,
  status,
  created_at,
  updated_at
FROM public.waitlist
WHERE wallet_address IS NOT NULL
  AND wallet_address ~ '^0x[a-f0-9]{40}$';

ALTER VIEW public.waitlist_distribution SET (security_invoker = true);
GRANT SELECT ON public.waitlist_distribution TO authenticated, service_role;

CREATE OR REPLACE VIEW public.waitlist_referral_leaderboard AS
SELECT
  w.referral_code AS code,
  COUNT(r.id)::INT AS referrals,
  CASE
    WHEN COUNT(r.id) >= 500 THEN 'Exclusive NFT'
    WHEN COUNT(r.id) >= 100 THEN 'Founder Role'
    WHEN COUNT(r.id) >= 25 THEN 'Genesis Badge'
    WHEN COUNT(r.id) >= 5 THEN 'Early Access'
    ELSE 'Member'
  END AS reward_tier
FROM public.waitlist w
LEFT JOIN public.waitlist r ON r.referred_by = w.referral_code
WHERE w.referral_code IS NOT NULL
GROUP BY w.referral_code
ORDER BY referrals DESC;

ALTER VIEW public.waitlist_referral_leaderboard SET (security_invoker = true);
GRANT SELECT ON public.waitlist_referral_leaderboard TO authenticated, service_role;

COMMENT ON TABLE public.waitlist IS
  'Pre-sale waitlist signups. Wallet addresses are stored for TGE token distribution.';
COMMENT ON COLUMN public.waitlist.referral_code IS
  'User own invite code (GAMI-XXXXXX), generated on insert.';
COMMENT ON COLUMN public.waitlist.referred_by IS
  'Invite code from ?ref= that brought this signup.';
COMMENT ON COLUMN public.waitlist.status IS
  'pending | registered | wallet_linked | kyc_pending | eligible | distributed';

-- Force PostgREST to pick up the new table immediately
NOTIFY pgrst, 'reload schema';
