import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase';
import { waitlistSchema } from '@/lib/waitlist-schema';

export const runtime = 'nodejs';

const ALERT_TO = process.env.WAITLIST_ALERT_EMAILS || 'waitlist@gamiprotocol.io';

async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const data = (await res.json()) as { success?: boolean };
  return Boolean(data.success);
}

async function sendAlertEmail(count: number, joinerEmail: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const recipients = ALERT_TO.split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  await resend.emails.send({
    from: process.env.WAITLIST_ALERT_FROM || 'Gami Waitlist <onboarding@resend.dev>',
    to: recipients,
    subject: `GAMI waitlist update: ${count.toLocaleString()} people`,
    html: `
      <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <p style="text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#6C3BFF;font-weight:700">Gami Protocol</p>
        <h1 style="font-size:28px;margin:8px 0 16px">Waitlist is at ${count.toLocaleString()}</h1>
        <p style="color:#333">New signup: <strong>${joinerEmail}</strong></p>
      </div>
    `,
  });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = waitlistSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const okCaptcha = await verifyTurnstile(data.turnstileToken);
    if (!okCaptcha) {
      return NextResponse.json({ ok: false, error: 'Captcha failed' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Waitlist backend is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY).',
        },
        { status: 503 },
      );
    }

    const email = data.email.toLowerCase();
    const wallet = data.walletAddress?.trim()
      ? data.walletAddress.trim().toLowerCase()
      : null;
    const interests = (data.interests || []).join(',');

    const row = {
      email,
      full_name: data.fullName,
      wallet_address: wallet,
      referral_code: data.referralCode || null,
      source: 'gami-site',
      country: data.country || null,
      company: data.company || null,
      role: data.role || null,
      interests: interests || null,
      status: wallet ? 'wallet_linked' : 'registered',
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase.from('waitlist').upsert(row, {
      onConflict: 'email',
    });

    if (upsertError) {
      // Older schemas may not have the new columns yet — retry with core fields.
      const { error: fallbackError } = await supabase.from('waitlist').upsert(
        {
          email: row.email,
          full_name: row.full_name,
          wallet_address: row.wallet_address,
          referral_code: row.referral_code,
          source: row.source,
          status: row.status,
        },
        { onConflict: 'email' },
      );
      if (fallbackError) {
        return NextResponse.json({ ok: false, error: fallbackError.message }, { status: 500 });
      }
    }

    const { count } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact', head: true });

    void sendAlertEmail(count ?? 0, email).catch(() => undefined);

    return NextResponse.json({
      ok: true,
      count: count ?? null,
      email,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ count: null, configured: false });
  }
  const { count } = await supabase.from('waitlist').select('id', { count: 'exact', head: true });
  return NextResponse.json({ count: count ?? 0, configured: true });
}
