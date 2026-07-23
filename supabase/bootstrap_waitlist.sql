-- =============================================================================
-- Gami Protocol — canonical waitlist + TGE wallet database
-- Project ref: xetqhdzvbfeiedbmopew
--
-- APPLY ONCE (SQL Editor):
--   https://supabase.com/dashboard/project/xetqhdzvbfeiedbmopew/sql/new
-- Paste this entire file → Run → wait ~10s
--
-- Or:  npm run waitlist:setup   (needs SUPABASE_ACCESS_TOKEN or DATABASE_URL)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) Waitlist signups (wallets ready for TGE distribution)
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
  -- TGE / distribution lifecycle
  eligible_for_tge BOOLEAN NOT NULL DEFAULT false,
  distributed_at TIMESTAMPTZ,
  distribution_tx TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_email_unique UNIQUE (email)
);

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
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS eligible_for_tge BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS distributed_at TIMESTAMPTZ;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS distribution_tx TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS notes TEXT;
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

UPDATE public.waitlist
SET eligible_for_tge = true
WHERE wallet_address IS NOT NULL
  AND wallet_address ~ '^0x[a-f0-9]{40}$'
  AND status IN ('wallet_linked', 'eligible', 'distributed');

-- Indexes for signup + TGE export
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
CREATE INDEX IF NOT EXISTS idx_waitlist_eligible_tge
  ON public.waitlist (eligible_for_tge)
  WHERE eligible_for_tge = true;

-- ---------------------------------------------------------------------------
-- 2) Live counter row (Realtime + /waitlist/live)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.waitlist_stats (
  id TEXT PRIMARY KEY DEFAULT 'waitlist',
  count BIGINT NOT NULL DEFAULT 0,
  wallet_count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_stats_singleton CHECK (id = 'waitlist')
);

INSERT INTO public.waitlist_stats (id, count, wallet_count, updated_at)
VALUES (
  'waitlist',
  (SELECT COUNT(*) FROM public.waitlist),
  (SELECT COUNT(*) FROM public.waitlist
     WHERE wallet_address IS NOT NULL AND wallet_address ~ '^0x[a-f0-9]{40}$'),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  count = EXCLUDED.count,
  wallet_count = EXCLUDED.wallet_count,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 3) Normalize signup rows + bump live stats
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

  IF NEW.wallet_address IS NOT NULL AND NEW.wallet_address ~ '^0x[a-f0-9]{40}$' THEN
    NEW.status := COALESCE(NULLIF(NEW.status, 'pending'), 'wallet_linked');
    IF NEW.status = 'pending' OR NEW.status = 'registered' THEN
      NEW.status := 'wallet_linked';
    END IF;
    NEW.eligible_for_tge := true;
  ELSIF NEW.status IS NULL OR btrim(NEW.status) = '' OR NEW.status = 'registered' THEN
    NEW.status := 'pending';
    NEW.eligible_for_tge := false;
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

CREATE OR REPLACE FUNCTION public.bump_waitlist_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recompute from source of truth so inserts/updates/deletes stay accurate
  INSERT INTO public.waitlist_stats (id, count, wallet_count, updated_at)
  VALUES (
    'waitlist',
    (SELECT COUNT(*) FROM public.waitlist),
    (SELECT COUNT(*) FROM public.waitlist
       WHERE wallet_address IS NOT NULL AND wallet_address ~ '^0x[a-f0-9]{40}$'),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    count = EXCLUDED.count,
    wallet_count = EXCLUDED.wallet_count,
    updated_at = now();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_waitlist_stats ON public.waitlist;
CREATE TRIGGER trg_bump_waitlist_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.waitlist
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.bump_waitlist_stats();

-- ---------------------------------------------------------------------------
-- 4) Alert subscribers (live email updates)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.waitlist_alert_subscribers (
  email TEXT PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 5) RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_alert_subscribers ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS waitlist_stats_public_read ON public.waitlist_stats;
CREATE POLICY waitlist_stats_public_read
  ON public.waitlist_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS waitlist_alert_subscribers_insert ON public.waitlist_alert_subscribers;
DROP POLICY IF EXISTS waitlist_alert_subscribers_update ON public.waitlist_alert_subscribers;

-- Prefer the SECURITY DEFINER RPC below for subscribe/unsubscribe (no public SELECT).
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
-- 6) Grants
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT INSERT ON TABLE public.waitlist TO anon, authenticated;
GRANT ALL ON TABLE public.waitlist TO service_role;

GRANT SELECT ON TABLE public.waitlist_stats TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.waitlist_stats TO service_role;

GRANT INSERT, UPDATE ON TABLE public.waitlist_alert_subscribers TO anon, authenticated;
GRANT ALL ON TABLE public.waitlist_alert_subscribers TO service_role;

-- ---------------------------------------------------------------------------
-- 7) RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.waitlist_public_count()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT count FROM public.waitlist_stats WHERE id = 'waitlist'),
    (SELECT COUNT(*)::BIGINT FROM public.waitlist)
  );
$$;

CREATE OR REPLACE FUNCTION public.waitlist_public_stats()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'count', COALESCE(s.count, 0),
    'wallet_count', COALESCE(s.wallet_count, 0),
    'updated_at', s.updated_at
  )
  FROM public.waitlist_stats s
  WHERE s.id = 'waitlist';
$$;

CREATE OR REPLACE FUNCTION public.waitlist_alert_set(p_email TEXT, p_active BOOLEAN DEFAULT true)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized TEXT := lower(trim(p_email));
BEGIN
  IF normalized IS NULL OR position('@' IN normalized) = 0 OR length(normalized) < 5 THEN
    RAISE EXCEPTION 'Valid email required';
  END IF;

  INSERT INTO public.waitlist_alert_subscribers (email, active, created_at, updated_at)
  VALUES (normalized, COALESCE(p_active, true), now(), now())
  ON CONFLICT (email) DO UPDATE
  SET
    active = EXCLUDED.active,
    updated_at = now();

  RETURN json_build_object('ok', true, 'email', normalized, 'active', COALESCE(p_active, true));
END;
$$;

REVOKE ALL ON FUNCTION public.waitlist_public_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.waitlist_public_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.waitlist_alert_set(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.waitlist_public_count() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.waitlist_public_stats() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.waitlist_alert_set(TEXT, BOOLEAN) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8) TGE export views (wallets ready to send)
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
  eligible_for_tge,
  distributed_at,
  distribution_tx,
  created_at,
  updated_at
FROM public.waitlist
WHERE wallet_address IS NOT NULL
  AND wallet_address ~ '^0x[a-f0-9]{40}$';

ALTER VIEW public.waitlist_distribution SET (security_invoker = true);
GRANT SELECT ON public.waitlist_distribution TO authenticated, service_role;

-- Strict TGE queue: linked wallets not yet distributed
CREATE OR REPLACE VIEW public.waitlist_tge_ready AS
SELECT
  id,
  email,
  full_name,
  wallet_address,
  referral_code,
  referred_by,
  source,
  status,
  created_at
FROM public.waitlist
WHERE eligible_for_tge = true
  AND wallet_address IS NOT NULL
  AND wallet_address ~ '^0x[a-f0-9]{40}$'
  AND distributed_at IS NULL
  AND status IN ('wallet_linked', 'eligible');

ALTER VIEW public.waitlist_tge_ready SET (security_invoker = true);
GRANT SELECT ON public.waitlist_tge_ready TO authenticated, service_role;

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
  'Genesis waitlist. wallet_address + eligible_for_tge feed TGE merkle/airdrop export.';
COMMENT ON VIEW public.waitlist_tge_ready IS
  'Wallets ready for token send: valid 0x address, eligible, not yet distributed.';
COMMENT ON TABLE public.waitlist_stats IS
  'Singleton live counters for /waitlist/live (Realtime).';

-- ---------------------------------------------------------------------------
-- 9) Realtime for live waitlist UI
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist_stats;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- Force PostgREST schema cache refresh
NOTIFY pgrst, 'reload schema';
