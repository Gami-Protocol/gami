import { withSupabase } from 'npm:@supabase/server';

function authorizedAdmin(req: Request): boolean {
  const expected = Deno.env.get('WAITLIST_ADMIN_SECRET') ?? '';
  if (!expected) return false;
  const header =
    req.headers.get('x-admin-secret')?.trim() ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    '';
  return header.length > 0 && header === expected;
}

Deno.serve(
  // Publishable gate for known clients; ops secret still required for PII reads.
  withSupabase({ auth: 'publishable' }, async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok');
    }
    if (req.method !== 'GET') {
      return Response.json({ error: 'method not allowed' }, { status: 405 });
    }
    if (!authorizedAdmin(req)) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    try {
      const url = new URL(req.url);
      const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();
      const wallet = (url.searchParams.get('wallet') ?? '').trim().toLowerCase();
      const company = (url.searchParams.get('company') ?? '').trim().toLowerCase();

      const supabase = ctx.supabaseAdmin;

      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      const { count: total } = await supabase
        .from('waitlist')
        .select('id', { count: 'exact', head: true });

      const { count: today } = await supabase
        .from('waitlist')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfDay.toISOString());

      const { data: allForAgg } = await supabase
        .from('waitlist')
        .select('source, country, referral_code, referred_by');

      const sourceMap = new Map<string, number>();
      const countryMap = new Map<string, number>();
      const referralMap = new Map<string, number>();

      for (const row of allForAgg ?? []) {
        const src = String(row.source ?? 'unknown');
        sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
        const c = String(row.country ?? 'unknown');
        countryMap.set(c, (countryMap.get(c) ?? 0) + 1);
        if (row.referred_by) {
          const code = String(row.referred_by);
          referralMap.set(code, (referralMap.get(code) ?? 0) + 1);
        }
      }

      const tier = (n: number) => {
        if (n >= 500) return 'Exclusive NFT';
        if (n >= 100) return 'Founder Role';
        if (n >= 25) return 'Genesis Badge';
        if (n >= 5) return 'Early Access';
        return 'Member';
      };

      const leaderboard = [...referralMap.entries()]
        .map(([code, referrals]) => ({ code, referrals, reward_tier: tier(referrals) }))
        .sort((a, b) => b.referrals - a.referrals)
        .slice(0, 50);

      let query = supabase
        .from('waitlist')
        .select(
          'id, email, full_name, company, role, wallet_address, referral_code, referred_by, source, country, status, created_at',
        )
        .order('created_at', { ascending: false })
        .limit(500);

      if (email) query = query.ilike('email', `%${email}%`);
      if (wallet) query = query.ilike('wallet_address', `%${wallet}%`);
      if (company) query = query.ilike('company', `%${company}%`);

      const { data: rows, error } = await query;
      if (error) throw error;

      return Response.json({
        ok: true,
        stats: {
          total: total ?? 0,
          today: today ?? 0,
          sources: [...sourceMap.entries()]
            .map(([source, count]) => ({ source, count }))
            .sort((a, b) => b.count - a.count),
          countries: [...countryMap.entries()]
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count),
          leaderboard,
        },
        rows: rows ?? [],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      return Response.json({ ok: false, error: message }, { status: 500 });
    }
  }),
);
