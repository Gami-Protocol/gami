import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function loadMerkleProof(wallet: string): string[] {
  const raw = Deno.env.get('MERKLE_PROOFS_JSON');
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as { proofs?: Record<string, string[]> };
    return data.proofs?.[wallet] ?? data.proofs?.[wallet.toLowerCase()] ?? [];
  } catch {
    return [];
  }
}

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

    if (!wallet.startsWith('0x')) {
      return new Response(JSON.stringify({ error: 'wallet_address required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: participant } = await supabase
      .from('sale_participants')
      .select('*')
      .eq('wallet_address', wallet)
      .maybeSingle();

    const { data: waitlist } = await supabase
      .from('waitlist')
      .select('id')
      .eq('wallet_address', wallet)
      .maybeSingle();

    const phase = Deno.env.get('SALE_PHASE') ?? 'public';
    const needsProof = phase === 'seed' || phase === 'private';

    return new Response(
      JSON.stringify({
        wallet_address: wallet,
        kyc_status: participant?.kyc_status ?? 'pending',
        phase: participant?.phase ?? phase,
        contributed_usd: Number(participant?.contributed_usd ?? 0),
        allocation_gami: Number(participant?.allocation_gami ?? 0),
        merkle_proof: needsProof ? loadMerkleProof(wallet) : [],
        on_waitlist: Boolean(waitlist),
        participant_id: participant?.id ?? null,
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
