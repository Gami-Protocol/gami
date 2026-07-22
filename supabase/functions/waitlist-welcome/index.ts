import { withSupabase } from 'npm:@supabase/server';
import { Resend } from 'npm:resend@4.0.0';

Deno.serve(
  withSupabase({ auth: ['publishable', 'secret'] }, async (req, _ctx) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok');
    }
    if (req.method !== 'POST') {
      return Response.json({ error: 'method not allowed' }, { status: 405 });
    }

    try {
      const body = await req.json();
      const email = String(body.email ?? '')
        .trim()
        .toLowerCase();
      const name = String(body.name ?? '').trim() || 'Pilot';
      const referralCode = String(body.referralCode ?? body.referral_code ?? '').trim();
      const referralLink =
        String(body.referralLink ?? body.referral_link ?? '').trim() ||
        (referralCode
          ? `https://gamiprotocol.io/?ref=${encodeURIComponent(referralCode)}`
          : 'https://gamiprotocol.io/waitlist');

      if (!email.includes('@')) {
        return Response.json({ error: 'valid email required' }, { status: 400 });
      }

      const apiKey = Deno.env.get('RESEND_API_KEY');
      if (!apiKey) {
        return Response.json({ ok: true, skipped: true, reason: 'RESEND_API_KEY not set' });
      }

      const resend = new Resend(apiKey);
      const from =
        Deno.env.get('WAITLIST_ALERT_FROM') || 'Gami Protocol <onboarding@resend.dev>';

      await resend.emails.send({
        from,
        to: email,
        subject: 'Welcome to Gami Protocol',
        html: `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#09090b;color:#fff">
          <p style="text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#a78bfa;font-weight:700">Gami Protocol</p>
          <h1 style="font-size:28px;margin:12px 0 8px">Welcome to Gami Protocol</h1>
          <p style="color:#a1a1aa;line-height:1.6">Hey ${name}, you're officially on the waitlist. We'll notify you before public launch.</p>
          <p style="margin:24px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.15em;color:#71717a">Your invite link</p>
          <p style="font-size:20px;font-weight:700;color:#22d3ee">${referralCode || '—'}</p>
          <p><a href="${referralLink}" style="color:#a78bfa">${referralLink}</a></p>
          <hr style="border:none;border-top:1px solid #27272a;margin:28px 0" />
          <p style="font-size:13px;color:#a1a1aa">
            <a href="https://gamiprotocol.io" style="color:#fff">Website</a> ·
            <a href="https://discord.gg/gamiprotocol" style="color:#fff">Discord</a> ·
            <a href="https://x.com/gamiprotocol" style="color:#fff">X</a> ·
            <a href="https://gamiprotocol.io/developers/docs" style="color:#fff">Docs</a>
          </p>
        </div>
      `,
      });

      return Response.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      return Response.json({ error: message }, { status: 500 });
    }
  }),
);
