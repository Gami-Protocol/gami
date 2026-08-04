import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-admin-secret',
};

const PAGE_SIZE = 200;
const SEND_CHUNK = 40;
const SALE_URL = 'https://gamiprotocol.io/sale';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function authorizedAdmin(req: Request): boolean {
  const expected = Deno.env.get('WAITLIST_ADMIN_SECRET') ?? '';
  if (!expected) return false;
  const header =
    req.headers.get('x-admin-secret')?.trim() ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    '';
  return header.length > 0 && header === expected;
}

function raiseLiveHtml(name: string) {
  const greeting = name && name !== 'Pilot' ? name : 'there';
  return `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#09090b;color:#fff">
      <p style="text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#a78bfa;font-weight:700">Gami Protocol</p>
      <h1 style="font-size:28px;margin:12px 0 8px">The $GAMI raise is live</h1>
      <p style="color:#a1a1aa;line-height:1.6">
        Hey ${greeting}, you asked us to alert you — the token raise is open now.
        Early waitlist members get priority access and launch multipliers.
      </p>
      <p style="margin:28px 0">
        <a href="${SALE_URL}"
           style="display:inline-block;background:#6C3BFF;color:#fff;text-decoration:none;padding:14px 22px;font-weight:700;border-radius:999px">
          Enter the raise →
        </a>
      </p>
      <p style="font-size:13px;color:#71717a;line-height:1.5">
        If the button does not work, open <a href="${SALE_URL}" style="color:#a78bfa">${SALE_URL}</a>
      </p>
      <hr style="border:none;border-top:1px solid #27272a;margin:28px 0" />
      <p style="font-size:12px;color:#52525b">
        You received this because you joined the Gami waitlist.
      </p>
    </div>
  `;
}

async function sendResend(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  const from =
    Deno.env.get('WAITLIST_ALERT_FROM') ||
    Deno.env.get('RESEND_FROM') ||
    'Gami Protocol <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: text || `Resend HTTP ${res.status}` };
  }
  return { ok: true };
}

type WaitlistRow = {
  id: string;
  email: string;
  full_name: string | null;
  raise_live_notified_at: string | null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  if (!authorizedAdmin(req)) {
    return json({ ok: false, error: 'unauthorized' }, 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const confirm = String(body.confirm ?? '').trim().toLowerCase();
    const dryRun = Boolean(body.dry_run ?? body.dryRun);
    const force = Boolean(body.force);
    const limitRaw = Number(body.limit ?? 0);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 5000) : 0;

    if (confirm !== 'raise is live') {
      return json(
        {
          ok: false,
          error: 'Set confirm to "raise is live" to send the blast.',
        },
        400,
      );
    }

    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) {
      return json({ ok: false, error: 'Supabase admin credentials missing' }, 500);
    }

    if (!Deno.env.get('RESEND_API_KEY') && !dryRun) {
      return json({ ok: false, error: 'RESEND_API_KEY not configured' }, 500);
    }

    const supabase = createClient(url, key);
    const recipients: WaitlistRow[] = [];
    let from = 0;

    while (true) {
      let query = supabase
        .from('waitlist')
        .select('id, email, full_name, raise_live_notified_at')
        .order('created_at', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (!force) {
        query = query.is('raise_live_notified_at', null);
      }

      const { data, error } = await query;
      if (error) {
        // Column may not exist yet — fall back without the filter/select field.
        if (String(error.message || '').includes('raise_live_notified_at')) {
          const fallback = await supabase
            .from('waitlist')
            .select('id, email, full_name')
            .order('created_at', { ascending: true })
            .range(from, from + PAGE_SIZE - 1);
          if (fallback.error) throw fallback.error;
          const page = (fallback.data ?? []).map((row) => ({
            id: String(row.id),
            email: String(row.email ?? '').toLowerCase(),
            full_name: row.full_name ? String(row.full_name) : null,
            raise_live_notified_at: null,
          }));
          recipients.push(...page.filter((r) => r.email.includes('@')));
          if (page.length < PAGE_SIZE) break;
          from += PAGE_SIZE;
          if (limit && recipients.length >= limit) break;
          continue;
        }
        throw error;
      }

      const page = (data ?? []).map((row) => ({
        id: String(row.id),
        email: String(row.email ?? '').toLowerCase(),
        full_name: row.full_name ? String(row.full_name) : null,
        raise_live_notified_at: row.raise_live_notified_at
          ? String(row.raise_live_notified_at)
          : null,
      }));

      recipients.push(...page.filter((r) => r.email.includes('@')));
      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
      if (limit && recipients.length >= limit) break;
    }

    const targets = limit ? recipients.slice(0, limit) : recipients;

    if (dryRun) {
      return json({
        ok: true,
        dry_run: true,
        would_send: targets.length,
        sample: targets.slice(0, 5).map((r) => r.email),
      });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    const notifiedAt = new Date().toISOString();

    for (let i = 0; i < targets.length; i += SEND_CHUNK) {
      const chunk = targets.slice(i, i + SEND_CHUNK);
      const results = await Promise.all(
        chunk.map(async (row) => {
          const name = row.full_name?.trim() || 'Pilot';
          const result = await sendResend({
            to: row.email,
            subject: 'The $GAMI raise is live — your waitlist alert',
            html: raiseLiveHtml(name),
            text: `Hey ${name}, the $GAMI raise is live. Enter now: ${SALE_URL}`,
          });
          return { row, result };
        }),
      );

      for (const { row, result } of results) {
        if (result.ok) {
          sent += 1;
          await supabase
            .from('waitlist')
            .update({ raise_live_notified_at: notifiedAt, updated_at: notifiedAt })
            .eq('id', row.id)
            .then(() => undefined)
            .catch(() => undefined);
        } else {
          failed += 1;
          if (errors.length < 10 && result.error) {
            errors.push(`${row.email}: ${result.error}`);
          }
        }
      }
    }

    return json({
      ok: failed === 0,
      sent,
      failed,
      total: targets.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return json({ ok: false, error: message }, 500);
  }
});
