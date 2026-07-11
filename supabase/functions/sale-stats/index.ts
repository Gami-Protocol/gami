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

    const { data: byPhase, error: phaseError } = await supabase.from('sale_stats').select('*');
    if (phaseError) throw phaseError;

    const { data: waitlistCount } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact', head: true });

    const { data: participants } = await supabase
      .from('sale_participants')
      .select('contributed_usd, allocation_gami, kyc_status');

    const approved = participants?.filter((p) => p.kyc_status === 'approved') ?? [];
    const totalRaised = approved.reduce((sum, p) => sum + Number(p.contributed_usd ?? 0), 0);
    const totalAllocation = approved.reduce((sum, p) => sum + Number(p.allocation_gami ?? 0), 0);

    const stats = {
      waitlist_count: waitlistCount ?? 0,
      total_raised_usd: totalRaised,
      total_allocation_gami: totalAllocation,
      participants_approved: approved.length,
      by_phase: byPhase ?? [],
      hard_cap_usd: 2_160_000,
      current_phase: Deno.env.get('SALE_PHASE') ?? 'public',
      updated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(stats), {
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
