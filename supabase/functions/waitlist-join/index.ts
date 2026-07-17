import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const fullName = String(body.full_name ?? body.fullName ?? '').trim() || null;
    const referralCode = String(body.referral_code ?? body.referralCode ?? '').trim() || null;
    const source = String(body.source ?? 'web').trim() || 'web';
    const rawWallet = String(body.wallet_address ?? body.walletAddress ?? '').trim();
    const walletAddress = rawWallet ? rawWallet.toLowerCase() : null;

    if (!email || !EMAIL_RE.test(email)) {
      return json({ error: 'valid email required' }, 400);
    }

    if (walletAddress && !WALLET_RE.test(walletAddress)) {
      return json({ error: 'wallet_address must be a valid 0x EVM address' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (walletAddress) {
      const { data: walletOwner } = await supabase
        .from('waitlist')
        .select('id, email')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (walletOwner && walletOwner.email !== email) {
        return json(
          { error: 'wallet_address already registered to another waitlist email' },
          409,
        );
      }
    }

    const { data: existing } = await supabase
      .from('waitlist')
      .select('id, email, wallet_address, full_name, referral_code, source, status')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      const patch: Record<string, unknown> = {};
      if (walletAddress && walletAddress !== existing.wallet_address) {
        patch.wallet_address = walletAddress;
      }
      if (fullName && fullName !== existing.full_name) {
        patch.full_name = fullName;
      }
      if (referralCode && !existing.referral_code) {
        patch.referral_code = referralCode;
      }
      if (source && source !== existing.source) {
        patch.source = source;
      }

      if (Object.keys(patch).length === 0) {
        return json({
          ok: true,
          id: existing.id,
          email: existing.email,
          wallet_address: existing.wallet_address,
          status: existing.status,
          created: false,
        });
      }

      const { data: updated, error: updateError } = await supabase
        .from('waitlist')
        .update(patch)
        .eq('id', existing.id)
        .select('id, email, wallet_address, status')
        .single();

      if (updateError) throw updateError;

      return json({
        ok: true,
        id: updated.id,
        email: updated.email,
        wallet_address: updated.wallet_address,
        status: updated.status,
        created: false,
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email,
        full_name: fullName,
        wallet_address: walletAddress,
        referral_code: referralCode,
        source,
      })
      .select('id, email, wallet_address, status')
      .single();

    if (insertError) throw insertError;

    return json({
      ok: true,
      id: inserted.id,
      email: inserted.email,
      wallet_address: inserted.wallet_address,
      status: inserted.status,
      created: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return json({ error: message }, 500);
  }
});
