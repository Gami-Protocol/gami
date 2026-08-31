import { NextResponse } from 'next/server';
import { CORS_HEADERS, normalizeHandle, supabaseOrNull } from '@/lib/gami-dns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse('ok', { headers: CORS_HEADERS });
}

/** GET /api/v1/dns/availability?handle=foo — live check for the signup forms. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const handle = normalizeHandle(url.searchParams.get('handle') ?? url.searchParams.get('name'));

  const supabase = supabaseOrNull();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'dns backend not configured' },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  const { data, error } = await supabase.rpc('is_gami_handle_available', { p_handle: handle });
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    { ok: true, handle, name: `${handle}.gami`, available: Boolean(data) },
    { headers: CORS_HEADERS },
  );
}
