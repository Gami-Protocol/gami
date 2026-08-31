/**
 * gami-dns — public `.gami` name service.
 *
 * Routes (sub-path after the function name):
 *   GET  /gami-dns/resolve?name=foo.gami   -> { name, handle, address, ... }
 *   GET  /gami-dns/availability?handle=foo -> { handle, available }
 *   POST /gami-dns/claim                   -> { ok, name, handle, status }
 *
 * Resolve and availability are public reads backed by SECURITY DEFINER RPCs.
 * Claim binds `<handle>.gami` to a wallet so buyers can be paid by name
 * instead of by copying a hex address.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\.gami$/i, '')
    .replace(/^@/, '');
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

type ResolveRow = {
  name: string;
  handle: string;
  address: string | null;
  solana_address: string | null;
  status: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!url || !serviceKey) {
    return Response.json(
      { ok: false, error: 'dns backend not configured' },
      { status: 503, headers: corsHeaders },
    );
  }

  const supabase = createClient(url, serviceKey);
  const reqUrl = new URL(req.url);
  // Everything after `/gami-dns`, e.g. "/resolve".
  const action = reqUrl.pathname.replace(/^.*\/gami-dns/, '').replace(/^\//, '') || 'resolve';

  try {
    if (action === 'resolve') {
      const name = normalizeHandle(reqUrl.searchParams.get('name') ?? '');
      if (!name) {
        return Response.json(
          { ok: false, error: 'name required' },
          { status: 400, headers: corsHeaders },
        );
      }

      const { data, error } = await supabase.rpc('resolve_gami_dns', { p_name: name });
      if (error) {
        return Response.json(
          { ok: false, error: error.message },
          { status: 500, headers: corsHeaders },
        );
      }

      const row = (Array.isArray(data) ? data[0] : data) as ResolveRow | undefined;
      if (!row?.address) {
        return Response.json(
          { ok: false, error: 'name not found', name: `${name}.gami` },
          { status: 404, headers: corsHeaders },
        );
      }

      return Response.json(
        {
          ok: true,
          name: row.name,
          handle: row.handle,
          address: row.address,
          solana_address: row.solana_address,
          status: row.status,
        },
        { headers: corsHeaders },
      );
    }

    if (action === 'availability') {
      const handle = normalizeHandle(reqUrl.searchParams.get('handle') ?? '');
      const { data, error } = await supabase.rpc('is_gami_handle_available', {
        p_handle: handle,
      });
      if (error) {
        return Response.json(
          { ok: false, error: error.message },
          { status: 500, headers: corsHeaders },
        );
      }
      return Response.json(
        { ok: true, handle, name: `${handle}.gami`, available: Boolean(data) },
        { headers: corsHeaders },
      );
    }

    if (action === 'claim') {
      if (req.method !== 'POST') {
        return Response.json(
          { ok: false, error: 'method not allowed' },
          { status: 405, headers: corsHeaders },
        );
      }

      const body = (await req.json()) as Record<string, unknown>;
      const handle = normalizeHandle(str(body.handle) || str(body.name));
      const email = str(body.email).toLowerCase();
      const address = (
        str(body.address) ||
        str(body.wallet_address) ||
        str(body.evm)
      ).toLowerCase();

      if (!handle) {
        return Response.json(
          { ok: false, error: 'handle required' },
          { status: 400, headers: corsHeaders },
        );
      }
      if (email && !EMAIL_RE.test(email)) {
        return Response.json(
          { ok: false, error: 'invalid email' },
          { status: 400, headers: corsHeaders },
        );
      }

      const { data, error } = await supabase.rpc('claim_gami_dns', {
        p_handle: handle,
        p_email: email || null,
        p_evm_address: address || null,
        p_solana_address: str(body.solana) || str(body.solana_address) || null,
        p_source: str(body.source) || 'wallet',
      });

      if (error) {
        return Response.json(
          { ok: false, error: error.message },
          { status: 500, headers: corsHeaders },
        );
      }

      const result = (data ?? { ok: false, error: 'no result' }) as {
        ok?: boolean;
        error?: string;
      };
      // 409 so callers can distinguish "taken" from a server fault.
      return Response.json(result, {
        status: result.ok ? 200 : 409,
        headers: corsHeaders,
      });
    }

    return Response.json(
      { ok: false, error: `unknown action: ${action}` },
      { status: 404, headers: corsHeaders },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return Response.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
});
