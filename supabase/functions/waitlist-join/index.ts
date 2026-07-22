import { withSupabase } from 'npm:@supabase/server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateReferralCode(): string {
  let code = 'GAMI-';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

Deno.serve(
  withSupabase({ auth: 'publishable' }, async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok');
    }
    if (req.method !== 'POST') {
      return Response.json({ error: 'method not allowed' }, { status: 405 });
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
      const referredBy =
        String(
          body.referred_by ?? body.referredBy ?? body.referral_code ?? body.referralCode ?? '',
        )
          .trim()
          .toUpperCase() || null;
      const source = String(body.source ?? 'website').trim() || 'website';
      const rawWallet = String(
        body.wallet_address ?? body.walletAddress ?? body.wallet ?? '',
      ).trim();
      const walletAddress = rawWallet ? rawWallet.toLowerCase() : null;

      if (!email || !EMAIL_RE.test(email)) {
        return Response.json({ error: 'valid email required' }, { status: 400 });
      }

      if (walletAddress && !WALLET_RE.test(walletAddress)) {
        return Response.json(
          { error: 'wallet_address must be a valid 0x EVM address' },
          { status: 400 },
        );
      }

      // Admin client bypasses RLS for upsert + duplicate checks.
      const supabase = ctx.supabaseAdmin;

      if (walletAddress) {
        const { data: walletOwner } = await supabase
          .from('waitlist')
          .select('id, email')
          .eq('wallet_address', walletAddress)
          .maybeSingle();

        if (walletOwner && walletOwner.email !== email) {
          return Response.json(
            { error: 'wallet_address already registered to another waitlist email' },
            { status: 409 },
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
          return Response.json({
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

        return Response.json({
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
        await ctx.supabaseAdmin.functions.invoke('waitlist-notify', {
          body: {
            count,
            event: 'join',
            joiner_email: inserted.email,
          },
        });
        await ctx.supabaseAdmin.functions.invoke('waitlist-welcome', {
          body: {
            email: inserted.email,
            name: fullName ?? 'Pilot',
            referralCode: inserted.referral_code,
            referralLink: `https://gamiprotocol.io/?ref=${encodeURIComponent(inserted.referral_code)}`,
          },
        });
      } catch {
        // Non-blocking alerts.
      }

      return Response.json({
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
      return Response.json({ error: message }, { status: 500 });
    }
  }),
);
