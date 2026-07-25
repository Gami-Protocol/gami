-- Built-in KYC applications for the $GAMI token sale.
-- Complements sale_participants.kyc_status and the external kyc-webhook provider path.

CREATE TABLE IF NOT EXISTS kyc_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  email TEXT NOT NULL,
  full_legal_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality TEXT NOT NULL,
  residence_country TEXT NOT NULL,
  document_type TEXT NOT NULL
    CHECK (document_type IN ('passport', 'national_id', 'drivers_license')),
  document_last4 TEXT,
  document_hash TEXT,
  ip_country TEXT,
  wallet_signature TEXT,
  signed_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'review')),
  provider TEXT NOT NULL DEFAULT 'builtin',
  provider_ref TEXT,
  rejection_reason TEXT,
  attested_not_restricted BOOLEAN NOT NULL DEFAULT false,
  attested_terms BOOLEAN NOT NULL DEFAULT false,
  attested_accuracy BOOLEAN NOT NULL DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallets are always stored lowercase by kyc-submit.
CREATE UNIQUE INDEX IF NOT EXISTS idx_kyc_applications_wallet_unique
  ON kyc_applications (wallet_address);

CREATE INDEX IF NOT EXISTS idx_kyc_applications_status
  ON kyc_applications (status);

CREATE INDEX IF NOT EXISTS idx_kyc_applications_created
  ON kyc_applications (created_at DESC);

ALTER TABLE kyc_applications ENABLE ROW LEVEL SECURITY;

-- No public direct table access — edge functions use the service role.
DROP POLICY IF EXISTS kyc_applications_deny_anon ON kyc_applications;
CREATE POLICY kyc_applications_deny_anon ON kyc_applications
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE kyc_applications IS
  'Identity verification submissions for token sale eligibility. Managed via kyc-submit / kyc-review / kyc-webhook.';
