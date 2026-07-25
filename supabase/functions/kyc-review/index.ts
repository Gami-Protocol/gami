import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-admin-secret',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function authorizedAdmin(req: Request): boolean {
  const expected =
    Deno.env.get('KYC_ADMIN_SECRET') ?? Deno.env.get('WAITLIST_ADMIN_SECRET') ?? '';
  if (!expected) return false;
  const header =
    req.headers.get('x-admin-secret')?.trim() ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    '';
  return header.length > 0 && header === expected;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (!authorizedAdmin(req)) return json({ ok: false, error: 'unauthorized' }, 401);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const status = (url.searchParams.get('status') ?? 'pending').trim().toLowerCase();
      const wallet = (url.searchParams.get('wallet') ?? '').trim().toLowerCase();

      let query = supabase
        .from('kyc_applications')
        .select(
          'id, wallet_address, email, full_legal_name, date_of_birth, nationality, residence_country, document_type, document_last4, ip_country, status, provider, rejection_reason, created_at, updated_at, reviewed_at',
        )
        .order('created_at', { ascending: false })
        .limit(200);

      if (status && status !== 'all') query = query.eq('status', status);
      if (wallet) query = query.eq('wallet_address', wallet);

      const { data, error } = await query;
      if (error) throw error;

      const { count: pendingCount } = await supabase
        .from('kyc_applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      return json({ ok: true, pending: pendingCount ?? 0, rows: data ?? [] });
    }

    if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

    const body = await req.json();
    const id = String(body.id ?? '').trim();
    const wallet = String(body.wallet_address ?? '').trim().toLowerCase();
    const decision = String(body.decision ?? body.kyc_status ?? '').trim().toLowerCase();
    const rejectionReason = String(body.rejection_reason ?? '').trim() || null;

    if (!['approved', 'rejected'].includes(decision)) {
      return json({ error: 'decision must be approved or rejected' }, 400);
    }
    if (!id && !wallet.startsWith('0x')) {
      return json({ error: 'id or wallet_address required' }, 400);
    }

    let targetId = id;
    let targetWallet = wallet;

    if (!targetId) {
      const { data: existing } = await supabase
        .from('kyc_applications')
        .select('id, wallet_address')
        .eq('wallet_address', wallet)
        .maybeSingle();
      if (!existing) return json({ error: 'application not found' }, 404);
      targetId = existing.id;
      targetWallet = existing.wallet_address;
    } else {
      const { data: existing } = await supabase
        .from('kyc_applications')
        .select('id, wallet_address')
        .eq('id', targetId)
        .maybeSingle();
      if (!existing) return json({ error: 'application not found' }, 404);
      targetWallet = existing.wallet_address;
    }

    const { data: application, error } = await supabase
      .from('kyc_applications')
      .update({
        status: decision,
        rejection_reason: decision === 'rejected' ? rejectionReason : null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetId)
      .select('id, wallet_address, email, status, rejection_reason, reviewed_at')
      .single();
    if (error) throw error;

    const { error: participantError } = await supabase.from('sale_participants').upsert(
      {
        wallet_address: targetWallet,
        email: application.email,
        kyc_status: decision,
        phase: Deno.env.get('SALE_PHASE') ?? 'public',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'wallet_address' },
    );
    if (participantError) throw participantError;

    if (decision === 'approved') {
      await supabase
        .from('waitlist')
        .update({ status: 'eligible', updated_at: new Date().toISOString() })
        .eq('wallet_address', targetWallet);
    }

    return json({ ok: true, application, kyc_status: decision });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return json({ error: message }, 500);
  }
});
