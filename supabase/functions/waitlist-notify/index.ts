import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const ALWAYS_ALERT = 'waitlist@gamiprotocol.io';

function parseRecipients(): string[] {
  const raw =
    Deno.env.get('WAITLIST_ALERT_EMAILS') ||
    Deno.env.get('WAITLIST_ALERT_EMAIL') ||
    ALWAYS_ALERT;
  const fromEnv = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes('@'));
  return [...new Set([ALWAYS_ALERT, ...fromEnv])];
}

async function sendResend(input: {
  to: string[];
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
    'Gami Waitlist <onboarding@resend.dev>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: input.to,
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

async function loadExtraRecipients(): Promise<string[]> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return [];

  try {
    const supabase = createClient(url, key);
    const { data } = await supabase.from('waitlist_alert_subscribers').select('email').eq('active', true);
    return (data ?? [])
      .map((row) => String(row.email ?? '').toLowerCase())
      .filter((email) => email.includes('@'));
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return json({ error: 'method not allowed' }, 405);
  }

  try {
    let count = 0;
    let event = 'digest';
    let joinerEmail: string | null = null;

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      count = Number(body.count ?? 0);
      event = String(body.event ?? 'join');
      joinerEmail = body.joiner_email ? String(body.joiner_email) : null;
    } else {
      // Digest / cron: pull count from Supabase waitlist table when available.
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      const { count: dbCount } = await supabase
        .from('waitlist')
        .select('id', { count: 'exact', head: true });
      count = dbCount ?? 0;
      event = 'digest';
    }

    if (!Number.isFinite(count) || count < 0) {
      return json({ error: 'valid count required' }, 400);
    }

    const recipients = [...new Set([...parseRecipients(), ...(await loadExtraRecipients())])];
    if (recipients.length === 0) {
      return json({ error: 'no alert recipients configured' }, 400);
    }

    const subject =
      event === 'join'
        ? `GAMI waitlist update: ${count.toLocaleString()} people`
        : `GAMI waitlist digest: ${count.toLocaleString()} people`;

    const joinerLine = joinerEmail
      ? `<p style="color:#666;font-size:14px">Latest signup: <strong>${joinerEmail}</strong></p>`
      : '';

    const html = `
      <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <p style="text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#6E3CFB;font-weight:700">Gami Protocol</p>
        <h1 style="font-size:28px;margin:8px 0 16px">Waitlist is at ${count.toLocaleString()}</h1>
        <p style="font-size:16px;color:#333;line-height:1.5">
          ${
            event === 'join'
              ? 'Someone just joined the genesis waitlist. Here is the live total.'
              : 'Scheduled waitlist digest.'
          }
        </p>
        <div style="border:2px solid #111;padding:20px;margin:24px 0;background:#fafafa">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:.15em;color:#666">People on waitlist</div>
          <div style="font-size:48px;font-weight:800;margin-top:8px">${count.toLocaleString()}</div>
        </div>
        ${joinerLine}
        <p style="font-size:12px;color:#999">Live counter also available at /waitlist/live</p>
      </div>
    `;

    const text = `GAMI waitlist ${event}: ${count} people.${joinerEmail ? ` Latest: ${joinerEmail}.` : ''}`;

    const sent = await sendResend({ to: recipients, subject, html, text });
    if (!sent.ok) {
      return json({ ok: false, error: sent.error, recipients, count }, 500);
    }

    return json({ ok: true, count, event, recipients });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return json({ error: message }, 500);
  }
});
