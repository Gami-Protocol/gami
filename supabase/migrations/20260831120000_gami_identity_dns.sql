-- =============================================================================
-- Gami Protocol — unified identity + .gami DNS registry
--
-- One signup surface shared by:
--   * gami-site  /api/waitlist            (marketing waitlist)
--   * gami-web   sale + waitlist forms    (token sale)
--   * gami-wallet onboarding              (mobile wallet)
--
-- All three resolve to ONE row in public.waitlist keyed by normalized email,
-- so a person who joins the waitlist and later installs the wallet keeps the
-- same referral code, the same .gami name, and the same welcome email.
--
-- Apply: supabase db push  (or paste into the SQL editor — this file is
-- idempotent and safe to re-run).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) Identity columns on the canonical waitlist row
-- ---------------------------------------------------------------------------
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS gami_handle TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS gami_dns_name TEXT;
-- Which product the person signed up from first: site | sale | wallet.
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS signup_surface TEXT;
-- How the linked wallet was produced: privy | local | external | none.
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS wallet_source TEXT;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS wallet_linked_at TIMESTAMPTZ;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS solana_address TEXT;
-- Set once the wallet app has attached this identity to a device.
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS wallet_app_linked_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_gami_handle_unique
  ON public.waitlist (gami_handle)
  WHERE gami_handle IS NOT NULL AND gami_handle <> '';

CREATE INDEX IF NOT EXISTS idx_waitlist_signup_surface ON public.waitlist (signup_surface);
CREATE INDEX IF NOT EXISTS idx_waitlist_wallet_app_linked
  ON public.waitlist (wallet_app_linked_at)
  WHERE wallet_app_linked_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2) The .gami name registry
--
-- `name` is always `<handle>.gami`. A handle is 3-15 chars of [a-z0-9_].
-- One name per email; one name per EVM address.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gami_dns_names (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  evm_address TEXT,
  solana_address TEXT,
  -- site | sale | wallet — where the name was claimed.
  source TEXT NOT NULL DEFAULT 'site',
  -- reserved: claimed at signup, wallet not proven yet.
  -- active:   bound to a wallet address that can receive GAMI.
  status TEXT NOT NULL DEFAULT 'reserved',
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gami_dns_handle_unique UNIQUE (handle),
  CONSTRAINT gami_dns_name_unique UNIQUE (name),
  CONSTRAINT gami_dns_handle_format CHECK (handle ~ '^[a-z0-9_]{3,15}$'),
  CONSTRAINT gami_dns_status_check CHECK (status IN ('reserved', 'active', 'released'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gami_dns_email_unique
  ON public.gami_dns_names (email)
  WHERE email IS NOT NULL AND email <> '' AND status <> 'released';

CREATE UNIQUE INDEX IF NOT EXISTS idx_gami_dns_evm_unique
  ON public.gami_dns_names (evm_address)
  WHERE evm_address IS NOT NULL AND evm_address <> '' AND status <> 'released';

CREATE INDEX IF NOT EXISTS idx_gami_dns_status ON public.gami_dns_names (status);
CREATE INDEX IF NOT EXISTS idx_gami_dns_source ON public.gami_dns_names (source);

-- Handles nobody may claim (brand, routing, and impersonation risks).
CREATE TABLE IF NOT EXISTS public.gami_dns_reserved_handles (
  handle TEXT PRIMARY KEY
);

INSERT INTO public.gami_dns_reserved_handles (handle)
VALUES
  ('gami'), ('admin'), ('root'), ('support'), ('help'), ('nova'),
  ('wallet'), ('sale'), ('ico'), ('team'), ('foundation'), ('protocol'),
  ('treasury'), ('staking'), ('airdrop'), ('official'), ('security'),
  ('billing'), ('legal'), ('press'), ('api'), ('www'), ('mail'),
  ('satoshi'), ('vitalik')
ON CONFLICT (handle) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) Normalization trigger for the registry
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_gami_dns_row()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.handle := lower(btrim(regexp_replace(COALESCE(NEW.handle, ''), '\.gami$', '', 'i')));
  NEW.name := NEW.handle || '.gami';

  IF NEW.email IS NOT NULL THEN
    NEW.email := nullif(lower(btrim(NEW.email)), '');
  END IF;

  IF NEW.evm_address IS NOT NULL THEN
    NEW.evm_address := nullif(lower(btrim(NEW.evm_address)), '');
  END IF;

  IF NEW.solana_address IS NOT NULL THEN
    NEW.solana_address := nullif(btrim(NEW.solana_address), '');
  END IF;

  -- A name only becomes resolvable once it points at a real EVM address.
  IF NEW.status <> 'released' THEN
    IF NEW.evm_address IS NOT NULL AND NEW.evm_address ~ '^0x[a-f0-9]{40}$' THEN
      NEW.status := 'active';
    ELSE
      NEW.status := 'reserved';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_gami_dns_row ON public.gami_dns_names;
CREATE TRIGGER trg_normalize_gami_dns_row
  BEFORE INSERT OR UPDATE ON public.gami_dns_names
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_gami_dns_row();

-- ---------------------------------------------------------------------------
-- 4) Public read helpers (SECURITY DEFINER — no table SELECT grant needed)
-- ---------------------------------------------------------------------------

/** True when `handle` is well-formed, unreserved, and unclaimed. */
CREATE OR REPLACE FUNCTION public.is_gami_handle_available(p_handle TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  h TEXT := lower(btrim(regexp_replace(COALESCE(p_handle, ''), '\.gami$', '', 'i')));
BEGIN
  IF h !~ '^[a-z0-9_]{3,15}$' THEN
    RETURN false;
  END IF;

  IF EXISTS (SELECT 1 FROM public.gami_dns_reserved_handles r WHERE r.handle = h) THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM public.gami_dns_names d
    WHERE d.handle = h AND d.status <> 'released'
  );
END;
$$;

/** Resolve `name.gami` (or a bare handle) to its bound addresses. */
CREATE OR REPLACE FUNCTION public.resolve_gami_dns(p_name TEXT)
RETURNS TABLE (
  name TEXT,
  handle TEXT,
  address TEXT,
  solana_address TEXT,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.name, d.handle, d.evm_address, d.solana_address, d.status
  FROM public.gami_dns_names d
  WHERE d.handle = lower(btrim(regexp_replace(COALESCE(p_name, ''), '\.gami$', '', 'i')))
    AND d.status = 'active'
  LIMIT 1;
$$;

/** Reverse lookup: which `.gami` name does this wallet answer to? */
CREATE OR REPLACE FUNCTION public.reverse_gami_dns(p_address TEXT)
RETURNS TABLE (
  name TEXT,
  handle TEXT,
  address TEXT,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.name, d.handle, d.evm_address, d.status
  FROM public.gami_dns_names d
  WHERE d.evm_address = lower(btrim(COALESCE(p_address, '')))
    AND d.status = 'active'
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- 5) claim_gami_dns — atomic reserve/rebind of a .gami name
--
-- Returns JSONB (not a record) so output names can never collide with the
-- column names this function assigns to.
-- Re-claiming your own name (same email) is a no-op update, so signing up on
-- the site and then on the wallet does not collide.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_gami_dns(
  p_handle TEXT,
  p_email TEXT DEFAULT NULL,
  p_evm_address TEXT DEFAULT NULL,
  p_solana_address TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'site'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_handle TEXT := lower(btrim(regexp_replace(COALESCE(p_handle, ''), '\.gami$', '', 'i')));
  v_email TEXT := nullif(lower(btrim(COALESCE(p_email, ''))), '');
  v_evm TEXT := nullif(lower(btrim(COALESCE(p_evm_address, ''))), '');
  v_sol TEXT := nullif(btrim(COALESCE(p_solana_address, '')), '');
  v_source TEXT := COALESCE(nullif(btrim(COALESCE(p_source, '')), ''), 'site');
  v_row public.gami_dns_names%ROWTYPE;
BEGIN
  IF v_handle !~ '^[a-z0-9_]{3,15}$' THEN
    RETURN jsonb_build_object(
      'ok', false, 'handle', v_handle,
      'error', 'handle must be 3-15 lowercase letters, numbers, or underscore');
  END IF;

  IF v_evm IS NOT NULL AND v_evm !~ '^0x[a-f0-9]{40}$' THEN
    RETURN jsonb_build_object(
      'ok', false, 'handle', v_handle,
      'error', 'evm_address must be a valid 0x address');
  END IF;

  IF EXISTS (SELECT 1 FROM public.gami_dns_reserved_handles r WHERE r.handle = v_handle) THEN
    RETURN jsonb_build_object('ok', false, 'handle', v_handle, 'error', 'handle is reserved');
  END IF;

  SELECT * INTO v_row
  FROM public.gami_dns_names d
  WHERE d.handle = v_handle AND d.status <> 'released'
  FOR UPDATE;

  IF FOUND THEN
    -- Owned by a different email — refuse.
    IF v_row.email IS NOT NULL AND (v_email IS NULL OR v_row.email <> v_email) THEN
      RETURN jsonb_build_object(
        'ok', false, 'handle', v_handle, 'name', v_row.name,
        'status', v_row.status, 'error', 'handle already claimed');
    END IF;

    -- Same owner, or an unowned reservation being adopted — fill in details.
    UPDATE public.gami_dns_names d
    SET
      email = COALESCE(v_email, d.email),
      evm_address = COALESCE(v_evm, d.evm_address),
      solana_address = COALESCE(v_sol, d.solana_address),
      source = v_source
    WHERE d.id = v_row.id
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
      'ok', true, 'handle', v_row.handle, 'name', v_row.name,
      'status', v_row.status, 'address', v_row.evm_address);
  END IF;

  -- This email already holds a different name — move it rather than duplicate.
  IF v_email IS NOT NULL THEN
    SELECT * INTO v_row
    FROM public.gami_dns_names d
    WHERE d.email = v_email AND d.status <> 'released'
    FOR UPDATE;

    IF FOUND THEN
      UPDATE public.gami_dns_names d
      SET
        handle = v_handle,
        evm_address = COALESCE(v_evm, d.evm_address),
        solana_address = COALESCE(v_sol, d.solana_address),
        source = v_source
      WHERE d.id = v_row.id
      RETURNING * INTO v_row;

      RETURN jsonb_build_object(
        'ok', true, 'handle', v_row.handle, 'name', v_row.name,
        'status', v_row.status, 'address', v_row.evm_address, 'moved', true);
    END IF;
  END IF;

  INSERT INTO public.gami_dns_names (handle, name, email, evm_address, solana_address, source)
  VALUES (v_handle, v_handle || '.gami', v_email, v_evm, v_sol, v_source)
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'ok', true, 'handle', v_row.handle, 'name', v_row.name,
    'status', v_row.status, 'address', v_row.evm_address, 'created', true);

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'ok', false, 'handle', v_handle, 'error', 'handle already claimed');
END;
$$;

-- ---------------------------------------------------------------------------
-- 6) upsert_gami_identity — THE shared signup entry point
--
-- Every surface calls exactly this, so waitlist signup and wallet signup
-- produce the same row, the same referral code, and the same .gami name.
-- Returns JSONB including `created`, so the caller knows whether to send the
-- welcome email.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_gami_identity(
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_handle TEXT DEFAULT NULL,
  p_evm_address TEXT DEFAULT NULL,
  p_solana_address TEXT DEFAULT NULL,
  p_wallet_source TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'site',
  p_signup_surface TEXT DEFAULT 'site',
  p_country TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_interests TEXT DEFAULT NULL,
  p_referred_by TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := nullif(lower(btrim(COALESCE(p_email, ''))), '');
  v_evm TEXT := nullif(lower(btrim(COALESCE(p_evm_address, ''))), '');
  v_sol TEXT := nullif(btrim(COALESCE(p_solana_address, '')), '');
  v_handle TEXT := nullif(lower(btrim(regexp_replace(COALESCE(p_handle, ''), '\.gami$', '', 'i'))), '');
  v_surface TEXT := COALESCE(nullif(btrim(COALESCE(p_signup_surface, '')), ''), 'site');
  v_is_wallet BOOLEAN := COALESCE(nullif(btrim(COALESCE(p_signup_surface, '')), ''), 'site') = 'wallet';
  v_id UUID;
  v_created BOOLEAN;
  v_dns JSONB;
  v_dns_error TEXT;
  v_row public.waitlist%ROWTYPE;
BEGIN
  IF v_email IS NULL OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'valid email required');
  END IF;

  IF v_evm IS NOT NULL AND v_evm !~ '^0x[a-f0-9]{40}$' THEN
    RETURN jsonb_build_object(
      'ok', false, 'email', v_email,
      'error', 'evm_address must be a valid 0x address');
  END IF;

  SELECT w.id INTO v_id FROM public.waitlist w WHERE w.email = v_email;
  v_created := v_id IS NULL;

  -- Reserve / rebind the .gami name first so the row can record it.
  IF v_handle IS NOT NULL THEN
    v_dns := public.claim_gami_dns(
      v_handle, v_email, v_evm, v_sol,
      CASE WHEN v_is_wallet THEN 'wallet' ELSE v_surface END);

    IF COALESCE((v_dns ->> 'ok')::BOOLEAN, false) THEN
      v_handle := v_dns ->> 'handle';
    ELSE
      v_dns_error := v_dns ->> 'error';
      v_handle := NULL;
    END IF;
  ELSIF v_evm IS NOT NULL THEN
    -- No handle asked for, but a wallet arrived: bind it to any name this
    -- email already reserved so the .gami becomes resolvable.
    UPDATE public.gami_dns_names d
    SET evm_address = COALESCE(d.evm_address, v_evm),
        solana_address = COALESCE(d.solana_address, v_sol)
    WHERE d.email = v_email AND d.status <> 'released';
  END IF;

  IF v_created THEN
    INSERT INTO public.waitlist (
      email, full_name, country, company, role, interests,
      wallet_address, solana_address, wallet_source, referred_by,
      source, signup_surface, gami_handle,
      wallet_linked_at, wallet_app_linked_at
    )
    VALUES (
      v_email,
      nullif(btrim(COALESCE(p_full_name, '')), ''),
      nullif(btrim(COALESCE(p_country, '')), ''),
      nullif(btrim(COALESCE(p_company, '')), ''),
      nullif(btrim(COALESCE(p_role, '')), ''),
      nullif(btrim(COALESCE(p_interests, '')), ''),
      v_evm, v_sol,
      nullif(btrim(COALESCE(p_wallet_source, '')), ''),
      nullif(upper(btrim(COALESCE(p_referred_by, ''))), ''),
      COALESCE(nullif(btrim(COALESCE(p_source, '')), ''), 'site'),
      v_surface,
      v_handle,
      CASE WHEN v_evm IS NOT NULL THEN now() ELSE NULL END,
      CASE WHEN v_is_wallet THEN now() ELSE NULL END
    )
    RETURNING id INTO v_id;
  ELSE
    -- Merge: never blank an existing value, never rewrite the first surface.
    UPDATE public.waitlist w
    SET
      full_name = COALESCE(nullif(btrim(COALESCE(p_full_name, '')), ''), w.full_name),
      country = COALESCE(nullif(btrim(COALESCE(p_country, '')), ''), w.country),
      company = COALESCE(nullif(btrim(COALESCE(p_company, '')), ''), w.company),
      role = COALESCE(nullif(btrim(COALESCE(p_role, '')), ''), w.role),
      interests = COALESCE(nullif(btrim(COALESCE(p_interests, '')), ''), w.interests),
      wallet_address = COALESCE(v_evm, w.wallet_address),
      solana_address = COALESCE(v_sol, w.solana_address),
      wallet_source = COALESCE(nullif(btrim(COALESCE(p_wallet_source, '')), ''), w.wallet_source),
      referred_by = COALESCE(w.referred_by, nullif(upper(btrim(COALESCE(p_referred_by, ''))), '')),
      gami_handle = COALESCE(v_handle, w.gami_handle),
      signup_surface = COALESCE(w.signup_surface, v_surface),
      wallet_linked_at = CASE
        WHEN v_evm IS NOT NULL THEN COALESCE(w.wallet_linked_at, now())
        ELSE w.wallet_linked_at
      END,
      wallet_app_linked_at = CASE
        WHEN v_is_wallet THEN COALESCE(w.wallet_app_linked_at, now())
        ELSE w.wallet_app_linked_at
      END
    WHERE w.id = v_id;
  END IF;

  UPDATE public.waitlist w
  SET gami_dns_name = w.gami_handle || '.gami'
  WHERE w.id = v_id AND w.gami_handle IS NOT NULL;

  SELECT * INTO v_row FROM public.waitlist w WHERE w.id = v_id;

  RETURN jsonb_build_object(
    'ok', true,
    'created', v_created,
    'email', v_row.email,
    'referral_code', v_row.referral_code,
    'gami_handle', v_row.gami_handle,
    'gami_dns_name', v_row.gami_dns_name,
    'wallet_address', v_row.wallet_address,
    'status', v_row.status,
    'signup_surface', v_row.signup_surface,
    'dns_error', v_dns_error);
END;
$$;

-- ---------------------------------------------------------------------------
-- 7) RLS + grants
--
-- The registry is never read directly by anon — the SECURITY DEFINER helpers
-- above expose exactly the resolve/availability surface that is safe to share.
-- ---------------------------------------------------------------------------
ALTER TABLE public.gami_dns_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gami_dns_reserved_handles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gami_dns_service_all ON public.gami_dns_names;
CREATE POLICY gami_dns_service_all
  ON public.gami_dns_names
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON TABLE public.gami_dns_names TO service_role;
GRANT ALL ON TABLE public.gami_dns_reserved_handles TO service_role;

GRANT EXECUTE ON FUNCTION public.is_gami_handle_available(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_gami_dns(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reverse_gami_dns(TEXT) TO anon, authenticated, service_role;

-- Claim + identity upsert are privileged: only the edge functions / API routes
-- (service_role) may call them, so captcha + rate limiting stay enforceable.
REVOKE ALL ON FUNCTION public.claim_gami_dns(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_gami_dns(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.upsert_gami_identity(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_gami_identity(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;

-- ---------------------------------------------------------------------------
-- 8) Backfill — existing waitlist rows keep their wallet link
-- ---------------------------------------------------------------------------
UPDATE public.waitlist
SET signup_surface = COALESCE(signup_surface, CASE
  WHEN source ILIKE '%wallet%' THEN 'wallet'
  WHEN source ILIKE '%sale%' OR source ILIKE '%web%' THEN 'sale'
  ELSE 'site'
END)
WHERE signup_surface IS NULL;

UPDATE public.waitlist
SET wallet_linked_at = COALESCE(wallet_linked_at, updated_at, created_at)
WHERE wallet_address IS NOT NULL
  AND wallet_address ~ '^0x[a-f0-9]{40}$'
  AND wallet_linked_at IS NULL;
