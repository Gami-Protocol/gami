-- Gami Protocol ICO + referral schema
-- Run via: supabase db push or supabase migration up

-- Extend profiles with ICO + referral fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_parent TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ico_participant_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sale_phase TEXT;

-- Waitlist for pre-sale signups
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  wallet_address TEXT,
  referral_code TEXT,
  source TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_referral ON waitlist(referral_code);

-- Sale participants (post-KYC contributors)
CREATE TABLE IF NOT EXISTS sale_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  email TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  phase TEXT DEFAULT 'public' CHECK (phase IN ('seed', 'private', 'public')),
  contributed_usd NUMERIC(18, 2) DEFAULT 0,
  allocation_gami NUMERIC(36, 18) DEFAULT 0,
  referral_code TEXT,
  referral_parent TEXT,
  merkle_leaf TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_participants_wallet ON sale_participants(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sale_participants_kyc ON sale_participants(kyc_status);

-- Claim events (post-TGE)
CREATE TABLE IF NOT EXISTS claim_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES sale_participants(id),
  wallet_address TEXT NOT NULL,
  amount NUMERIC(36, 18) NOT NULL,
  tx_hash TEXT,
  claimed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_events_wallet ON claim_events(wallet_address);

-- Referral tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  owner_wallet TEXT,
  owner_handle TEXT,
  invite_count INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_owner ON referrals(owner_wallet);

-- Sale stats view for dashboard
CREATE OR REPLACE VIEW sale_stats AS
SELECT
  phase,
  COUNT(*) AS participants,
  COALESCE(SUM(contributed_usd), 0) AS total_raised_usd,
  COALESCE(SUM(allocation_gami), 0) AS total_allocation_gami
FROM sale_participants
WHERE kyc_status = 'approved'
GROUP BY phase;

-- RLS policies (enable after auth setup)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Service role can manage all; anon can insert waitlist
CREATE POLICY waitlist_insert ON waitlist FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY waitlist_select_own ON waitlist FOR SELECT TO authenticated USING (true);
