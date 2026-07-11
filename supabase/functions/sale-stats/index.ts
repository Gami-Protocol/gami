import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createPublicClient, formatUnits, http } from 'https://esm.sh/viem@2.21.0';
import { baseSepolia } from 'https://esm.sh/viem@2.21.0/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TOKEN_SALE_ABI = [
  {
    name: 'totalRaised',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

async function fetchOnChainRaised(): Promise<number> {
  const saleAddress = Deno.env.get('TOKEN_SALE_ADDRESS');
  const rpcUrl = Deno.env.get('BASE_SEPOLIA_RPC') ?? 'https://sepolia.base.org';
  if (!saleAddress) return 0;

  try {
    const client = createPublicClient({ chain: baseSepolia, transport: http(rpcUrl) });
    const raw = await client.readContract({
      address: saleAddress as `0x${string}`,
      abi: TOKEN_SALE_ABI,
      functionName: 'totalRaised',
    });
    return Number(formatUnits(raw as bigint, 6));
  } catch {
    return 0;
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

    const { data: byPhase, error: phaseError } = await supabase.from('sale_stats').select('*');
    if (phaseError) throw phaseError;

    const { data: waitlistCount } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact', head: true });

    const { data: participants } = await supabase
      .from('sale_participants')
      .select('contributed_usd, allocation_gami, kyc_status');

    const approved = participants?.filter((p) => p.kyc_status === 'approved') ?? [];
    const dbRaised = approved.reduce((sum, p) => sum + Number(p.contributed_usd ?? 0), 0);
    const onChainRaised = await fetchOnChainRaised();
    const totalRaised = Math.max(dbRaised, onChainRaised);
    const totalAllocation = approved.reduce((sum, p) => sum + Number(p.allocation_gami ?? 0), 0);

    const stats = {
      waitlist_count: waitlistCount ?? 0,
      total_raised_usd: totalRaised,
      total_allocation_gami: totalAllocation,
      participants_approved: approved.length,
      on_chain_raised_usdc: onChainRaised,
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
