import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kyc-signature',
};

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function validSignature(payload: string, signature: string | null): Promise<boolean> {
  const secret = Deno.env.get('KYC_WEBHOOK_SECRET');
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return constantTimeEqual(expected, signature.replace(/^sha256=/, '').toLowerCase());
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.text();
    if (!(await validSignature(payload, req.headers.get('x-kyc-signature')))) {
      return new Response(JSON.stringify({ error: 'invalid webhook signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = JSON.parse(payload);
    const { wallet_address, kyc_status, email, phase } = body;

    if (
      typeof wallet_address !== 'string' ||
      !/^0x[0-9a-fA-F]{40}$/.test(wallet_address) ||
      !['pending', 'approved', 'rejected'].includes(kyc_status)
    ) {
      return new Response(JSON.stringify({ error: 'valid wallet_address and kyc_status required' }), {
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
