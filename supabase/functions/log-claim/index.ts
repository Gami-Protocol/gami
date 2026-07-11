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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json();
    const wallet = String(body.wallet_address ?? '').toLowerCase();
    const amount = body.amount ?? '0';
    const txHash = body.tx_hash ?? null;

    if (!wallet.startsWith('0x')) {
      return new Response(JSON.stringify({ error: 'wallet_address required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: participant } = await supabase
      .from('sale_participants')
      .select('id')
      .eq('wallet_address', wallet)
      .maybeSingle();

    const { error } = await supabase.from('claim_events').insert({
      participant_id: participant?.id ?? null,
      wallet_address: wallet,
      amount,
      tx_hash: txHash,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
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
