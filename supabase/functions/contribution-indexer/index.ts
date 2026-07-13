import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createPublicClient, http, parseAbiItem } from 'https://esm.sh/viem@2.21.0';
import { base, baseSepolia } from 'https://esm.sh/viem@2.21.0/chains';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONTRIBUTION_EVENT = parseAbiItem(
  'event Contribution(address indexed buyer, uint256 paymentAmount, uint256 gamiAmount)',
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const saleAddress = Deno.env.get('TOKEN_SALE_ADDRESS');
    const chainId = Number(Deno.env.get('CHAIN_ID') ?? '84532');
    const chain = chainId === base.id ? base : baseSepolia;
    const rpcUrl =
      Deno.env.get('BASE_RPC_URL') ??
      (chainId === base.id ? 'https://mainnet.base.org' : 'https://sepolia.base.org');
    const fromBlock = BigInt(Deno.env.get('INDEX_FROM_BLOCK') ?? '0');

    if (!saleAddress) {
      return new Response(JSON.stringify({ error: 'TOKEN_SALE_ADDRESS not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const client = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const logs = await client.getLogs({
      address: saleAddress as `0x${string}`,
      event: CONTRIBUTION_EVENT,
      fromBlock,
      toBlock: 'latest',
    });

    const totals = new Map<string, { payment: bigint; gami: bigint }>();
    for (const log of logs) {
      const buyer = String(log.args.buyer).toLowerCase();
      const current = totals.get(buyer) ?? { payment: 0n, gami: 0n };
      totals.set(buyer, {
        payment: current.payment + (log.args.paymentAmount ?? 0n),
        gami: current.gami + (log.args.gamiAmount ?? 0n),
      });
    }

    let indexed = 0;
    for (const [buyer, total] of totals) {
      const { error } = await supabase.from('sale_participants').upsert(
        {
          wallet_address: buyer,
          contributed_usd: Number(total.payment) / 1_000_000,
          allocation_gami: Number(total.gami) / 1e18,
          phase: Deno.env.get('SALE_PHASE') ?? 'public',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'wallet_address' },
      );

      if (!error) indexed += 1;
    }

    return new Response(JSON.stringify({ ok: true, indexed, total_logs: logs.length }), {
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
