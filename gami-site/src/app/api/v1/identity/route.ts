import { NextResponse } from 'next/server';
import { CORS_HEADERS, EMAIL_RE, normalizeHandle, supabaseOrNull } from '@/lib/gami-dns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse('ok', { headers: CORS_HEADERS });
}

/**
 * POST /api/v1/identity — the shared signup/sign-in endpoint.
 *
 * Mirrors the `gami-identity` edge function so the wallet app can talk to one
 * base URL (`EXPO_PUBLIC_GAMI_API_BASE`) for identity and DNS alike. Keyed on
 * email, so waitlist and wallet signups converge on the same backend row.
 */
export async function POST(req: Request) {
  const supabase = supabaseOrNull();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'identity backend not configured' },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid JSON body' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const read = (...keys: string[]): string => {
    for (const key of keys) {
      const value = body[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  };

  const email = read('email').toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'valid email required' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const surfaceRaw = read('surface', 'signup_surface', 'signupSurface').toLowerCase();
  const surface = ['site', 'sale', 'wallet'].includes(surfaceRaw) ? surfaceRaw : 'site';
  const interests = Array.isArray(body.interests)
    ? (body.interests as unknown[]).filter((i): i is string => typeof i === 'string').join(',')
    : read('interests');

  const { data, error } = await supabase.rpc('upsert_gami_identity', {
    p_email: email,
    p_full_name: read('full_name', 'fullName', 'name') || null,
    p_handle: normalizeHandle(read('handle', 'gami_handle')) || null,
    p_evm_address: read('wallet_address', 'walletAddress', 'evm').toLowerCase() || null,
    p_solana_address: read('solana_address', 'solanaAddress', 'solana') || null,
    p_wallet_source: read('wallet_source', 'walletSource') || null,
    p_source: read('source') || `gami-${surface}`,
    p_signup_surface: surface,
    p_country: read('country') || null,
    p_company: read('company') || null,
    p_role: read('role') || null,
    p_interests: interests || null,
    p_referred_by: read('referred_by', 'referredBy', 'referralCode').toUpperCase() || null,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const result = (data ?? { ok: false, error: 'no result' }) as { ok?: boolean };
  return NextResponse.json(result, {
    status: result.ok ? 200 : 400,
    headers: CORS_HEADERS,
  });
}
