import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase';
import { waitlistSchema } from '@/lib/waitlist-schema';
import { normalizeHandle } from '@/lib/gami-dns';

export const runtime = 'nodejs';

const ALERT_TO = process.env.WAITLIST_ALERT_EMAILS || 'waitlist@gamiprotocol.io';

/** Shape returned by the `upsert_gami_identity` RPC. */
type GamiIdentityResult = {
  ok?: boolean;
  created?: boolean;
  referral_code?: string | null;
  gami_dns_name?: string | null;
  dns_error?: string | null;
  error?: string;
};

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

async function sendWelcomeEmail(email: string, fullName: string, gamiDnsName?: string | null) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const name = fullName.trim() || 'Pilot';
  await resend.emails.send({
    from: process.env.WAITLIST_ALERT_FROM || 'Gami Protocol <onboarding@resend.dev>',
    to: email,
    subject: 'Welcome to Gami Protocol',
    html: `
      <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#09090b;color:#fff">
        <p style="text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#a78bfa;font-weight:700">Gami Protocol</p>
        <h1 style="font-size:28px;margin:12px 0 8px">Welcome to Gami Protocol</h1>
        <p style="color:#a1a1aa;line-height:1.6">
          Hey ${name}, you're officially on the waitlist. We'll email you the moment the $GAMI raise goes live.
        </p>
        ${
          gamiDnsName
            ? `<p style="margin:20px 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:#71717a">Your Gami name</p>
               <p style="font-size:22px;font-weight:700;color:#22d3ee;margin:0">${gamiDnsName}</p>
               <p style="color:#a1a1aa;font-size:13px;line-height:1.6;margin:8px 0 0">
                 Sign in to the Gami Wallet with this same email and your name unlocks there too —
                 buy $GAMI and it lands straight at ${gamiDnsName}, no address to copy.
               </p>`
            : ''
        }
        <p style="margin:24px 0">
          <a href="https://gamiprotocol.io/waitlist"
             style="display:inline-block;background:#6C3BFF;color:#fff;text-decoration:none;padding:12px 20px;font-weight:700;border-radius:999px">
            Complete your profile →
          </a>
        </p>
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
    const wallet = data.walletAddress?.trim() ? data.walletAddress.trim().toLowerCase() : null;
    const interests = (data.interests || []).join(',');
    const gamiHandle = normalizeHandle(data.gamiHandle);

    // Canonical path: one shared identity keyed on email, so this signup and a
    // later Gami Wallet signup resolve to the same row, referral code, and
    // `.gami` name. Falls back to a plain upsert when the identity migration
    // has not been applied to this project yet.
    let identity: GamiIdentityResult | null = null;

    const { data: rpcData, error: rpcError } = await supabase.rpc('upsert_gami_identity', {
      p_email: email,
      p_full_name: data.fullName,
      p_handle: gamiHandle || null,
      p_evm_address: wallet,
      p_source: 'gami-site',
      p_signup_surface: 'site',
      p_country: data.country || null,
      p_company: data.company || null,
      p_role: data.role || null,
      p_interests: interests || null,
      p_referred_by: data.referralCode || null,
    });

    if (!rpcError) {
      identity = (rpcData ?? null) as GamiIdentityResult | null;
      if (identity && identity.ok === false) {
        return NextResponse.json(
          { ok: false, error: identity.error || 'Could not join waitlist' },
          { status: 400 },
        );
      }
    } else {
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
    }

    const { count } = await supabase.from('waitlist').select('id', { count: 'exact', head: true });

    // Never re-welcome a returning signup. When the RPC is unavailable we have
    // no `created` flag, so fall back to emailing (previous behavior).
    const isNewSignup = identity ? identity.created !== false : true;
    if (isNewSignup) {
      void sendAlertEmail(count ?? 0, email).catch(() => undefined);
      void sendWelcomeEmail(email, data.fullName, identity?.gami_dns_name).catch(() => undefined);
    }

    return NextResponse.json({
      ok: true,
      count: count ?? null,
      email,
      created: identity?.created ?? null,
      referralCode: identity?.referral_code ?? null,
      gamiDnsName: identity?.gami_dns_name ?? null,
      dnsError: identity?.dns_error ?? null,
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
