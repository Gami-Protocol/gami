import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_BLOCKED = ['US', 'CU', 'IR', 'KP', 'SY'];
const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

type DocType = 'passport' | 'national_id' | 'drivers_license';

function blockedCountries(): string[] {
  const raw = Deno.env.get('BLOCKED_COUNTRIES') ?? '';
  if (!raw.trim()) return DEFAULT_BLOCKED;
  return raw.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
}

function isBlocked(...codes: Array<string | null | undefined>): string | null {
  const blocked = new Set(blockedCountries());
  for (const code of codes) {
    const normalized = (code ?? '').trim().toUpperCase();
    if (normalized && blocked.has(normalized)) return normalized;
  }
  return null;
}

function requireManualReview(): boolean {
  return (Deno.env.get('KYC_REQUIRE_MANUAL_REVIEW') ?? '').toLowerCase() === 'true';
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  try {
    const body = await req.json();
    const wallet = String(body.wallet_address ?? '').trim().toLowerCase();
    const email = String(body.email ?? '').trim().toLowerCase();
    const fullLegalName = String(body.full_legal_name ?? '').trim();
    const dateOfBirth = String(body.date_of_birth ?? '').trim();
    const nationality = String(body.nationality ?? '').trim().toUpperCase();
    const residenceCountry = String(body.residence_country ?? '').trim().toUpperCase();
    const documentType = String(body.document_type ?? '').trim() as DocType;
    const documentNumber = String(body.document_number ?? '').trim().replace(/\s+/g, '');
    const ipCountry = String(body.ip_country ?? '').trim().toUpperCase() || null;
    const walletSignature = String(body.wallet_signature ?? '').trim();
    const signedMessage = String(body.signed_message ?? '').trim();
    const attestedNotRestricted = Boolean(body.attested_not_restricted);
    const attestedTerms = Boolean(body.attested_terms);
    const attestedAccuracy = Boolean(body.attested_accuracy);

    if (!WALLET_RE.test(wallet)) return json({ error: 'valid wallet_address required' }, 400);
    if (!email.includes('@')) return json({ error: 'valid email required' }, 400);
    if (fullLegalName.length < 2) return json({ error: 'full_legal_name required' }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return json({ error: 'date_of_birth must be YYYY-MM-DD' }, 400);
    }
    if (!/^[A-Z]{2}$/.test(nationality) || !/^[A-Z]{2}$/.test(residenceCountry)) {
      return json({ error: 'nationality and residence_country must be ISO country codes' }, 400);
    }
    if (!['passport', 'national_id', 'drivers_license'].includes(documentType)) {
      return json({ error: 'invalid document_type' }, 400);
    }
    if (documentNumber.length < 4) return json({ error: 'document_number required' }, 400);
    if (!attestedNotRestricted || !attestedTerms || !attestedAccuracy) {
      return json({ error: 'all compliance attestations are required' }, 400);
    }
    if (!walletSignature.startsWith('0x') || !signedMessage.includes(wallet)) {
      return json({ error: 'wallet signature confirming the application is required' }, 400);
    }

    const birth = new Date(`${dateOfBirth}T00:00:00Z`);
    const ageMs = Date.now() - birth.getTime();
    const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
    if (!Number.isFinite(ageYears) || ageYears < 18) {
      return json({ error: 'applicants must be at least 18 years old' }, 400);
    }

    const blocked = isBlocked(nationality, residenceCountry, ipCountry);
    if (blocked) {
      return json(
        {
          error: `Identity verification is unavailable for restricted jurisdiction: ${blocked}`,
          blocked_country: blocked,
        },
        403,
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const documentHash = await sha256Hex(`${documentType}:${documentNumber.toUpperCase()}:${wallet}`);
    const documentLast4 = documentNumber.slice(-4);
    const manual = requireManualReview();
    const status = manual ? 'pending' : 'approved';

    const row = {
      wallet_address: wallet,
      email,
      full_legal_name: fullLegalName,
      date_of_birth: dateOfBirth,
      nationality,
      residence_country: residenceCountry,
      document_type: documentType,
      document_last4: documentLast4,
      document_hash: documentHash,
      ip_country: ipCountry,
      wallet_signature: walletSignature,
      signed_message: signedMessage,
      status,
      provider: 'builtin',
      attested_not_restricted: true,
      attested_terms: true,
      attested_accuracy: true,
      reviewed_at: manual ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: application, error: appError } = await supabase
      .from('kyc_applications')
      .upsert(row, { onConflict: 'wallet_address' })
      .select('id, wallet_address, status, provider, created_at, updated_at')
      .single();

    if (appError) throw appError;

    await syncParticipant(supabase, wallet, email, status);
    await touchWaitlist(supabase, wallet);

    return json({
      ok: true,
      application,
      kyc_status: status,
      auto_approved: !manual,
      next_step: status === 'approved' ? 'eligibility' : 'review',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return json({ error: message }, 500);
  }
});

async function syncParticipant(
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  email: string,
  kycStatus: string,
) {
  const { error } = await supabase.from('sale_participants').upsert(
    {
      wallet_address: wallet,
      email,
      kyc_status: kycStatus === 'approved' ? 'approved' : kycStatus === 'rejected' ? 'rejected' : 'pending',
      phase: Deno.env.get('SALE_PHASE') ?? 'public',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'wallet_address' },
  );
  if (error) throw error;
}

async function touchWaitlist(supabase: ReturnType<typeof createClient>, wallet: string) {
  await supabase
    .from('waitlist')
    .update({ status: 'kyc_pending', updated_at: new Date().toISOString() })
    .eq('wallet_address', wallet)
    .then(() => undefined)
    .catch(() => undefined);
}
