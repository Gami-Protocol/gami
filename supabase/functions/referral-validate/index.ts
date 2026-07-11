import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, wallet_address, handle } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'code required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const normalised = code.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    const { data: referral, error: lookupError } = await supabase
      .from('referrals')
      .select('*')
      .eq('code', normalised)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (!referral) {
      return new Response(JSON.stringify({ valid: false, error: 'invalid code' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Attribute invite if wallet provided
    if (wallet_address) {
      await supabase.from('profiles').upsert(
        {
          wallet_address: wallet_address.toLowerCase(),
          referral_parent: normalised,
          handle: handle ?? null,
        },
        { onConflict: 'wallet_address' },
      );

      await supabase
        .from('referrals')
        .update({ invite_count: (referral.invite_count ?? 0) + 1 })
        .eq('code', normalised);
    }

    return new Response(
      JSON.stringify({
        valid: true,
        code: normalised,
        owner_handle: referral.owner_handle,
        inviter_xp_bonus: 100,
        invitee_xp_bonus: 50,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
