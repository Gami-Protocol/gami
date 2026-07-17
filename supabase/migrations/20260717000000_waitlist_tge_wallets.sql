-- Waitlist enhancements for TGE wallet distribution
-- Stores full signup details and indexes wallets for easy export at token generation.

ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'registered';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'waitlist_status_check'
  ) THEN
    ALTER TABLE waitlist
      ADD CONSTRAINT waitlist_status_check
      CHECK (status IN ('registered', 'wallet_linked', 'kyc_pending', 'eligible', 'distributed'));
  END IF;
END $$;

-- Normalize existing rows so eligibility lookups and merkle exports match case-insensitively.
UPDATE waitlist
SET email = lower(trim(email))
WHERE email IS DISTINCT FROM lower(trim(email));

UPDATE waitlist
SET wallet_address = lower(trim(wallet_address))
WHERE wallet_address IS NOT NULL
  AND wallet_address <> ''
  AND wallet_address IS DISTINCT FROM lower(trim(wallet_address));

UPDATE waitlist
SET status = 'wallet_linked'
WHERE wallet_address IS NOT NULL
  AND wallet_address <> ''
  AND (status IS NULL OR status = 'registered');

CREATE OR REPLACE FUNCTION normalize_waitlist_row()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;

  IF NEW.full_name IS NOT NULL THEN
    NEW.full_name := nullif(trim(NEW.full_name), '');
  END IF;

  IF NEW.wallet_address IS NOT NULL THEN
    NEW.wallet_address := nullif(lower(trim(NEW.wallet_address)), '');
  END IF;

  IF NEW.wallet_address IS NOT NULL
     AND (NEW.status IS NULL OR NEW.status = 'registered') THEN
    NEW.status := 'wallet_linked';
  ELSIF NEW.status IS NULL THEN
    NEW.status := 'registered';
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

CREATE INDEX IF NOT EXISTS idx_waitlist_wallet ON waitlist (wallet_address);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist (status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist (created_at);

-- One wallet per waitlist entry when a wallet is provided (TGE distribution key).
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_wallet_unique
  ON waitlist (wallet_address)
  WHERE wallet_address IS NOT NULL AND wallet_address <> '';

-- Export-ready view: valid EVM wallets collected from the waitlist.
CREATE OR REPLACE VIEW waitlist_distribution AS
SELECT
  id,
  email,
  full_name,
  wallet_address,
  referral_code,
  source,
  status,
  created_at,
  updated_at
FROM waitlist
WHERE wallet_address IS NOT NULL
  AND wallet_address ~ '^0x[a-f0-9]{40}$';

-- Enforce underlying waitlist RLS for non-service roles.
ALTER VIEW waitlist_distribution SET (security_invoker = true);

GRANT SELECT ON waitlist_distribution TO authenticated;
GRANT SELECT ON waitlist_distribution TO service_role;

COMMENT ON TABLE waitlist IS
  'Pre-sale waitlist signups. Wallet addresses are stored for TGE token distribution.';
COMMENT ON VIEW waitlist_distribution IS
  'Waitlist rows with valid lowercase EVM wallets, ready for TGE merkle/airdrop export.';
COMMENT ON COLUMN waitlist.status IS
  'registered | wallet_linked | kyc_pending | eligible | distributed';
