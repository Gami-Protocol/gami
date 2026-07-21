import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateReferralCode(): string {
  let code = 'GAMI-';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
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
    const fullName = String(body.full_name ?? body.fullName ?? body.name ?? '').trim() || null;
    const company = String(body.company ?? '').trim() || null;
    const role = String(body.role ?? '').trim() || null;
    const country = String(body.country ?? '').trim() || null;
    const referredBy = String(body.referred_by ?? body.referredBy ?? body.referral_code ?? body.referralCode ?? '')
      .trim()
      .toUpperCase() || null;
    const source = String(body.source ?? 'website').trim() || 'website';
    const rawWallet = String(body.wallet_address ?? body.walletAddress ?? body.wallet ?? '').trim();
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
      .select(
        'id, email, wallet_address, full_name, company, role, referral_code, referred_by, source, status',
      )
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      const patch: Record<string, unknown> = {};
      if (walletAddress && walletAddress !== existing.wallet_address) {
        patch.wallet_address = walletAddress;
      }
      if (fullName && fullName !== existing.full_name) patch.full_name = fullName;
      if (company && company !== existing.company) patch.company = company;
      if (role && role !== existing.role) patch.role = role;
      if (referredBy && !existing.referred_by) patch.referred_by = referredBy;
      if (source && source !== existing.source) patch.source = source;

      if (Object.keys(patch).length === 0) {
        return json({
          ok: true,
          already: true,
          id: existing.id,
          email: existing.email,
          wallet_address: existing.wallet_address,
          status: existing.status,
          referral_code: existing.referral_code,
          created: false,
        });
      }

      const { data: updated, error: updateError } = await supabase
        .from('waitlist')
        .update(patch)
        .eq('id', existing.id)
        .select('id, email, wallet_address, status, referral_code')
        .single();

      if (updateError) throw updateError;

      return json({
        ok: true,
        already: true,
        id: updated.id,
        email: updated.email,
        wallet_address: updated.wallet_address,
        status: updated.status,
        referral_code: updated.referral_code,
        created: false,
      });
    }

    let referralCode = generateReferralCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: clash } = await supabase
        .from('waitlist')
        .select('id')
        .eq('referral_code', referralCode)
        .maybeSingle();
      if (!clash) break;
      referralCode = generateReferralCode();
    }

    const { data: inserted, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email,
        full_name: fullName,
        company,
        role,
        country,
        wallet_address: walletAddress,
        referral_code: referralCode,
        referred_by: referredBy,
        source,
        status: walletAddress ? 'wallet_linked' : 'pending',
      })
      .select('id, email, wallet_address, status, referral_code')
      .single();

    if (insertError) throw insertError;

    try {
      const { count } = await supabase.from('waitlist').select('id', { count: 'exact', head: true });
      const notifyBase = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '');
      if (notifyBase && count != null) {
        void fetch(`${notifyBase}/functions/v1/waitlist-notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            count,
            event: 'join',
            joiner_email: inserted.email,
          }),
        });
        void fetch(`${notifyBase}/functions/v1/waitlist-welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: inserted.email,
            name: fullName ?? 'Pilot',
            referralCode: inserted.referral_code,
            referralLink: `https://gamiprotocol.io/?ref=${encodeURIComponent(inserted.referral_code)}`,
          }),
        });
      }
    } catch {
      // Non-blocking.
    }

    return json({
      ok: true,
      id: inserted.id,
      email: inserted.email,
      wallet_address: inserted.wallet_address,
      status: inserted.status,
      referral_code: inserted.referral_code,
      created: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return json({ error: message }, 500);
  }
});
