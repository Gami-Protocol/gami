/**
 * gami-identity — the one signup / sign-in endpoint for every Gami surface.
 *
 * The marketing site, the token sale site, and the wallet app all POST here.
 * Identity is keyed on the normalized email, so a person who joins the
 * waitlist on the web and later installs the wallet lands on the SAME backend
 * row, keeps the SAME referral code, and keeps the SAME `.gami` name.
 *
 * POST body:
 *   email          (required)
 *   full_name / fullName
 *   handle                     -> reserves `<handle>.gami`
 *   wallet_address / evm       -> binds the name so GAMI can be sent to it
 *   solana_address
 *   wallet_source              privy | local | external
 *   surface                    site | sale | wallet
 *   source, country, company, role, interests, referred_by
 *   turnstile_token            verified when TURNSTILE_SECRET_KEY is set
 *
 * Response: { ok, created, email, referral_code, gami_handle, gami_dns_name,
 *             wallet_address, status, dns_error }
 *
 * `created` drives the welcome email so a returning user is never re-mailed.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SURFACES = new Set(['site', 'sale', 'wallet']);

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function pick(body: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = str(body[key]);
    if (value) return value;
  }
  return '';
}

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  // No secret configured -> captcha not enforced for this deployment.
  if (!secret) return true;
  if (!token) return false;

  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

type IdentityResult = {
  ok: boolean;
  created?: boolean;
  email?: string;
  referral_code?: string | null;
  gami_handle?: string | null;
  gami_dns_name?: string | null;
  wallet_address?: string | null;
  status?: string | null;
  dns_error?: string | null;
  error?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return Response.json({ error: 'method not allowed' }, { status: 405, headers: corsHeaders });
  }

  try {
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!url || !serviceKey) {
      return Response.json(
        { ok: false, error: 'identity backend not configured' },
        { status: 503, headers: corsHeaders },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;

    const email = pick(body, 'email').toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return Response.json(
        { ok: false, error: 'valid email required' },
        { status: 400, headers: corsHeaders },
      );
    }

    const captchaOk = await verifyTurnstile(
      pick(body, 'turnstile_token', 'turnstileToken', 'captcha_token'),
    );
    if (!captchaOk) {
      return Response.json(
        { ok: false, error: 'captcha verification failed' },
        { status: 400, headers: corsHeaders },
      );
    }

    const rawSurface = pick(body, 'surface', 'signup_surface', 'signupSurface').toLowerCase();
    const surface = SURFACES.has(rawSurface) ? rawSurface : 'site';

    const handle = pick(body, 'handle', 'gami_handle', 'gamiHandle')
      .toLowerCase()
      .replace(/\.gami$/i, '')
      .replace(/^@/, '');

    const walletAddress = pick(
      body,
      'wallet_address',
      'walletAddress',
      'evm_address',
      'evmAddress',
      'wallet',
    ).toLowerCase();

    const supabase = createClient(url, serviceKey);

    const { data, error } = await supabase.rpc('upsert_gami_identity', {
      p_email: email,
      p_full_name: pick(body, 'full_name', 'fullName', 'name') || null,
      p_handle: handle || null,
      p_evm_address: walletAddress || null,
      p_solana_address: pick(body, 'solana_address', 'solanaAddress', 'solana') || null,
      p_wallet_source: pick(body, 'wallet_source', 'walletSource') || null,
      p_source: pick(body, 'source') || `gami-${surface}`,
      p_signup_surface: surface,
      p_country: pick(body, 'country') || null,
      p_company: pick(body, 'company') || null,
      p_role: pick(body, 'role') || null,
      p_interests: Array.isArray(body.interests)
        ? (body.interests as unknown[])
            .map((i) => str(i))
            .filter(Boolean)
            .join(',')
        : pick(body, 'interests') || null,
      p_referred_by:
        pick(body, 'referred_by', 'referredBy', 'referral_code', 'referralCode').toUpperCase() ||
        null,
    });

    if (error) {
      return Response.json(
        { ok: false, error: error.message },
        { status: 500, headers: corsHeaders },
      );
    }

    const result = (data ?? { ok: false, error: 'no result' }) as IdentityResult;
    if (!result.ok) {
      return Response.json(result, { status: 400, headers: corsHeaders });
    }

    // Same welcome email for every surface — only on first creation.
    if (result.created) {
      const referralCode = result.referral_code ?? '';
      try {
        await supabase.functions.invoke('waitlist-welcome', {
          body: {
            email: result.email,
            name: pick(body, 'full_name', 'fullName', 'name') || 'Pilot',
            referralCode,
            referralLink: referralCode
              ? `https://gamiprotocol.io/?ref=${encodeURIComponent(referralCode)}`
              : 'https://gamiprotocol.io/waitlist',
            gamiDnsName: result.gami_dns_name ?? null,
            surface,
          },
        });

        const { count } = await supabase
          .from('waitlist')
          .select('id', { count: 'exact', head: true });

        await supabase.functions.invoke('waitlist-notify', {
          body: { count, event: 'join', joiner_email: result.email, surface },
        });
      } catch {
        // Alerts are best-effort — never fail a signup because email is down.
      }
    }

    return Response.json(result, { headers: corsHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return Response.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
});
