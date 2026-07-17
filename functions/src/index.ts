import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { defineString } from 'firebase-functions/params';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { setTimeout as sleep } from 'node:timers/promises';

initializeApp();

const resendApiKey = defineString('RESEND_API_KEY', { default: '' });
const alertFrom = defineString('WAITLIST_ALERT_FROM', {
  default: 'Gami Waitlist <onboarding@resend.dev>',
});
const alertEmails = defineString('WAITLIST_ALERT_EMAILS', {
  default: 'waitlist@gamiprotocol.io',
});

const ALWAYS_ALERT = 'waitlist@gamiprotocol.io';

function parseRecipients(extra: string[] = []): string[] {
  const fromEnv = alertEmails
    .value()
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes('@'));
  return [...new Set([ALWAYS_ALERT, ...fromEnv, ...extra])];
}

async function loadSubscriberEmails(): Promise<string[]> {
  const db = getFirestore();
  const snap = await db
    .collection('waitlist_alert_subscribers')
    .where('active', '==', true)
    .get();
  return snap.docs
    .map((d) => String(d.data().email ?? d.id).toLowerCase())
    .filter((email) => email.includes('@'));
}

async function sendResendEmail(input: {
  to: string[];
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const apiKey = resendApiKey.value();
  if (!apiKey) {
    logger.warn('RESEND_API_KEY missing — skip waitlist alert email');
    return;
  }
  if (input.to.length === 0) {
    logger.warn('No waitlist alert recipients');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: alertFrom.value(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend failed: ${res.status} ${body}`);
  }
}

async function emailWaitlistCount(count: number, joinerEmail?: string | null) {
  const recipients = parseRecipients(await loadSubscriberEmails());
  const subject = `GAMI waitlist update: ${count.toLocaleString()} people`;
  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <p style="text-transform:uppercase;letter-spacing:.2em;font-size:11px;color:#6E3CFB;font-weight:700">Gami Protocol</p>
      <h1 style="font-size:28px;margin:8px 0 16px">Waitlist is at ${count.toLocaleString()}</h1>
      <p style="font-size:16px;color:#333">Someone just joined the genesis waitlist.</p>
      <div style="border:2px solid #111;padding:20px;margin:24px 0;background:#fafafa">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:.15em;color:#666">People on waitlist</div>
        <div style="font-size:48px;font-weight:800;margin-top:8px">${count.toLocaleString()}</div>
      </div>
      ${
        joinerEmail
          ? `<p style="color:#666;font-size:14px">Latest signup: <strong>${joinerEmail}</strong></p>`
          : ''
      }
      <p style="font-size:12px;color:#999">Live counter: /waitlist/live</p>
    </div>
  `;
  const text = `GAMI waitlist update: ${count} people.${joinerEmail ? ` Latest: ${joinerEmail}.` : ''}`;
  await sendResendEmail({ to: recipients, subject, html, text });
}

/**
 * Email subscribers when a waitlist doc is created.
 * Relies on the web client to increment `stats/waitlist` for the live counter;
 * waits briefly so that counter is usually available before sending.
 *
 * Tip: if you also use the Supabase `waitlist-notify` edge function from the
 * client, leave `VITE_WAITLIST_NOTIFY_URL` empty to avoid duplicate emails.
 */
export const onWaitlistCreated = onDocumentCreated('waitlist/{entryId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  await sleep(1500);
  const stats = await getFirestore().doc('stats/waitlist').get();
  const count = Number(stats.data()?.count ?? 0);

  try {
    await emailWaitlistCount(count > 0 ? count : 1, data.email ? String(data.email) : null);
  } catch (error) {
    logger.error('Failed to send waitlist alert email', error);
  }
});

/** Manual / cron HTTP endpoint to email the current Firestore waitlist count. */
export const waitlistDigest = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const stats = await getFirestore().doc('stats/waitlist').get();
  const count = Number(stats.data()?.count ?? 0);

  try {
    await emailWaitlistCount(count, null);
    res.json({ ok: true, count });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'email failed';
    res.status(500).json({ ok: false, error: message, count });
  }
});
