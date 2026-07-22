-- Bootstrap production waitlist for gami-protocol Supabase project.
-- Safe to run in the Supabase SQL editor on a fresh project.

CREATE TABLE IF NOT EXISTS waitlist (
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (email)
);

ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS interests TEXT;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';

ALTER TABLE waitlist DROP CONSTRAINT IF EXISTS waitlist_status_check;
ALTER TABLE waitlist
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

UPDATE waitlist SET status = 'pending' WHERE status IS NULL OR status = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_referral_code_unique
  ON waitlist (referral_code)
  WHERE referral_code IS NOT NULL AND referral_code <> '';

CREATE INDEX IF NOT EXISTS idx_waitlist_referred_by ON waitlist (referred_by);
CREATE INDEX IF NOT EXISTS idx_waitlist_company ON waitlist (company);
CREATE INDEX IF NOT EXISTS idx_waitlist_source ON waitlist (source);
CREATE INDEX IF NOT EXISTS idx_waitlist_wallet ON waitlist (wallet_address);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist (status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist (created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_wallet_unique
  ON waitlist (wallet_address)
  WHERE wallet_address IS NOT NULL AND wallet_address <> '';

CREATE OR REPLACE FUNCTION normalize_waitlist_row()
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

  IF NEW.referred_by IS NOT NULL THEN
    NEW.referred_by := upper(nullif(trim(NEW.referred_by), ''));
  END IF;

  IF NEW.wallet_address IS NOT NULL THEN
    NEW.wallet_address := nullif(lower(trim(NEW.wallet_address)), '');
  END IF;

  IF NEW.wallet_address IS NOT NULL THEN
    NEW.status := 'wallet_linked';
  ELSIF NEW.status IS NULL OR NEW.status = '' OR NEW.status = 'registered' THEN
    NEW.status := 'pending';
  END IF;

  IF NEW.referral_code IS NULL OR trim(NEW.referral_code) = '' THEN
    LOOP
      code := 'GAMI-';
      FOR i IN 1..6 LOOP
        code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      END LOOP;
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM waitlist w WHERE w.referral_code = code
      );
    END LOOP;
    NEW.referral_code := code;
  ELSE
    NEW.referral_code := upper(trim(NEW.referral_code));
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_waitlist_row ON waitlist;
CREATE TRIGGER trg_normalize_waitlist_row
  BEFORE INSERT OR UPDATE ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION normalize_waitlist_row();

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS waitlist_insert ON waitlist;
DROP POLICY IF EXISTS waitlist_select_own ON waitlist;
DROP POLICY IF EXISTS waitlist_anon_insert ON waitlist;
DROP POLICY IF EXISTS waitlist_anon_select ON waitlist;
DROP POLICY IF EXISTS waitlist_anon_update ON waitlist;
DROP POLICY IF EXISTS waitlist_anon_delete ON waitlist;

CREATE POLICY waitlist_anon_insert
  ON waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) >= 5
    AND length(email) <= 254
  );

CREATE OR REPLACE FUNCTION public.waitlist_public_count()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::BIGINT FROM waitlist;
$$;

REVOKE ALL ON FUNCTION public.waitlist_public_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.waitlist_public_count() TO anon, authenticated;

CREATE OR REPLACE VIEW waitlist_distribution AS
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
FROM waitlist
WHERE wallet_address IS NOT NULL
  AND wallet_address ~ '^0x[a-f0-9]{40}$';

ALTER VIEW waitlist_distribution SET (security_invoker = true);
GRANT SELECT ON waitlist_distribution TO authenticated;
GRANT SELECT ON waitlist_distribution TO service_role;

CREATE OR REPLACE VIEW waitlist_referral_leaderboard AS
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
FROM waitlist w
LEFT JOIN waitlist r ON r.referred_by = w.referral_code
WHERE w.referral_code IS NOT NULL
GROUP BY w.referral_code
ORDER BY referrals DESC;

ALTER VIEW waitlist_referral_leaderboard SET (security_invoker = true);

COMMENT ON TABLE waitlist IS
  'Pre-sale waitlist signups. Wallet addresses are stored for TGE token distribution.';
COMMENT ON COLUMN waitlist.referral_code IS
  'User''s own invite code (GAMI-XXXXXX), generated on insert.';
COMMENT ON COLUMN waitlist.referred_by IS
  'Invite code from ?ref= that brought this signup.';
COMMENT ON COLUMN waitlist.status IS
  'pending | registered | wallet_linked | kyc_pending | eligible | distributed';
