import { NextResponse } from 'next/server';
import { CORS_HEADERS, EMAIL_RE, EVM_RE, normalizeHandle, supabaseOrNull } from '@/lib/gami-dns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse('ok', { headers: CORS_HEADERS });
}

/**
 * POST /api/v1/wallets/register
 * { address, solana?, email?, handle?, tokens?, chain? }
 *
 * Called by the wallet once Gami chain readiness attaches a wallet. When the
 * email is known this links the device wallet to the person's existing
 * waitlist identity, so a waitlist signup and a wallet install converge on one
 * backend row. Without an email it still binds the address to a `.gami` name.
 */
export async function POST(req: Request) {
  const supabase = supabaseOrNull();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'wallet registry not configured' },
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

  const address = read('address', 'evm', 'wallet_address', 'walletAddress').toLowerCase();
  if (!address || !EVM_RE.test(address)) {
    return NextResponse.json(
      { ok: false, error: 'valid 0x address required' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const email = read('email').toLowerCase();
  const solana = read('solana', 'solana_address', 'solanaAddress');
  const handle = normalizeHandle(read('handle', 'name'));

  // With an email we can merge into the canonical identity row.
  if (email) {
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { ok: false, error: 'invalid email' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const { data, error } = await supabase.rpc('upsert_gami_identity', {
      p_email: email,
      p_handle: handle || null,
      p_evm_address: address,
      p_solana_address: solana || null,
      p_wallet_source: read('wallet_source', 'walletSource') || 'wallet',
      p_source: read('source') || 'gami-wallet',
      p_signup_surface: 'wallet',
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: CORS_HEADERS },
      );
    }
    return NextResponse.json(data ?? { ok: true }, { headers: CORS_HEADERS });
  }

  // Anonymous device wallet — bind the name only.
  if (!handle) {
    return NextResponse.json(
      { ok: true, registered: true, address, linked: false },
      { headers: CORS_HEADERS },
    );
  }

  const { data, error } = await supabase.rpc('claim_gami_dns', {
    p_handle: handle,
    p_email: null,
    p_evm_address: address,
    p_solana_address: solana || null,
    p_source: 'wallet',
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const result = (data ?? { ok: false }) as { ok?: boolean };
  return NextResponse.json(
    { ...result, address, linked: false },
    { status: result.ok ? 200 : 409, headers: CORS_HEADERS },
  );
}
