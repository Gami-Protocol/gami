import { NextResponse } from 'next/server';
import { CORS_HEADERS, EMAIL_RE, normalizeHandle, supabaseOrNull } from '@/lib/gami-dns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse('ok', { headers: CORS_HEADERS });
}

/**
 * POST /api/v1/dns/claim
 * { handle | name, email?, address?, solana?, source? }
 *
 * Called by the wallet's onboarding handle step and by the sale-site signup
 * form. Re-claiming your own name is a no-op, so both surfaces can call it.
 */
export async function POST(req: Request) {
  const supabase = supabaseOrNull();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'dns backend not configured' },
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

  const handle = normalizeHandle(read('handle', 'name'));
  const email = read('email').toLowerCase();
  const address = read('address', 'wallet_address', 'walletAddress', 'evm').toLowerCase();

  if (!handle) {
    return NextResponse.json(
      { ok: false, error: 'handle required' },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: 'invalid email' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const { data, error } = await supabase.rpc('claim_gami_dns', {
    p_handle: handle,
    p_email: email || null,
    p_evm_address: address || null,
    p_solana_address: read('solana', 'solana_address', 'solanaAddress') || null,
    p_source: read('source') || 'wallet',
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const result = (data ?? { ok: false, error: 'no result' }) as { ok?: boolean };
  // 409 lets callers tell "already taken" apart from a server fault.
  return NextResponse.json(result, {
    status: result.ok ? 200 : 409,
    headers: CORS_HEADERS,
  });
}
