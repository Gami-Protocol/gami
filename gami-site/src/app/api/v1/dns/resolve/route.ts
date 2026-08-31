import { NextResponse } from 'next/server';
import { CORS_HEADERS, normalizeHandle, supabaseOrNull, type ResolveRow } from '@/lib/gami-dns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse('ok', { headers: CORS_HEADERS });
}

/**
 * GET /api/v1/dns/resolve?name=foo.gami
 *
 * The Gami wallet calls this to turn a `.gami` name into a payable address,
 * so buyers never have to paste a hex address to receive GAMI.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const handle = normalizeHandle(url.searchParams.get('name'));
  // Reverse lookup: which name does this wallet answer to?
  const address = (url.searchParams.get('address') ?? '').trim().toLowerCase();

  if (!handle && !address) {
    return NextResponse.json(
      { ok: false, error: 'name or address required' },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const supabase = supabaseOrNull();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'dns backend not configured' },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  const { data, error } = handle
    ? await supabase.rpc('resolve_gami_dns', { p_name: handle })
    : await supabase.rpc('reverse_gami_dns', { p_address: address });
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  const row = (Array.isArray(data) ? data[0] : data) as ResolveRow | undefined;
  if (!row?.address) {
    return NextResponse.json(
      {
        ok: false,
        error: 'name not found',
        ...(handle ? { name: `${handle}.gami` } : { address }),
      },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      name: row.name,
      handle: row.handle,
      address: row.address,
      solana_address: row.solana_address ?? null,
      status: row.status,
    },
    { headers: CORS_HEADERS },
  );
}
