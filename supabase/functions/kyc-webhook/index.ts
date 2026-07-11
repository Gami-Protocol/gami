import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kyc-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json();
    const { wallet_address, kyc_status, email, phase } = body;

    if (!wallet_address || !kyc_status) {
      return new Response(JSON.stringify({ error: 'wallet_address and kyc_status required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('sale_participants')
      .upsert(
        {
          wallet_address: wallet_address.toLowerCase(),
          kyc_status,
          email: email ?? null,
          phase: phase ?? 'public',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'wallet_address' },
      )
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, participant: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
