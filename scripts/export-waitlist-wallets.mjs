#!/usr/bin/env node
/**
 * Export waitlist wallets from Supabase for TGE token distribution.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SECRET_KEY=... npm run waitlist:export
 *   npm run waitlist:export -- --format csv --out ./waitlist-wallets.csv
 *   npm run waitlist:export -- --format participants --view tge_ready
 *
 * Env:
 *   SUPABASE_URL
 *   SUPABASE_SECRET_KEY  (or SUPABASE_SERVICE_ROLE_KEY)
 *
 * Views:
 *   distribution  — all valid 0x wallets (default)
 *   tge_ready     — eligible wallets not yet distributed
 *   waitlist      — full table (requires --include-email-only style full dump)
 */

import fs from 'node:fs';

const args = process.argv.slice(2);

function flag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
}

const format = (flag('--format', 'json') || 'json').toLowerCase();
const outPath = flag('--out', null);
const view = (flag('--view', 'distribution') || 'distribution').toLowerCase();
const includeEmailOnly = args.includes('--include-email-only');

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(
  /\/$/,
  '',
);
const serviceKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    'Missing SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).',
  );
  process.exit(1);
}

const table =
  includeEmailOnly || view === 'waitlist'
    ? 'waitlist'
    : view === 'tge_ready'
      ? 'waitlist_tge_ready'
      : 'waitlist_distribution';

const select =
  table === 'waitlist_tge_ready'
    ? 'id,email,full_name,wallet_address,referral_code,referred_by,source,status,created_at'
    : 'id,email,full_name,wallet_address,referral_code,referred_by,source,status,eligible_for_tge,distributed_at,created_at,updated_at';

const endpoint = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=created_at.asc`;

const res = await fetch(endpoint, {
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Accept: 'application/json',
  },
});

if (!res.ok) {
  const body = await res.text();
  console.error('Export failed:', res.status, body);
  if (body.includes('PGRST205') || body.includes('schema cache')) {
    console.error(
      '\nApply supabase/bootstrap_waitlist.sql in the SQL Editor first:\n  https://supabase.com/dashboard/project/xetqhdzvbfeiedbmopew/sql/new\n',
    );
  }
  process.exit(1);
}

const rows = await res.json();

if (!Array.isArray(rows)) {
  console.error('Unexpected response shape from Supabase.');
  process.exit(1);
}

const wallets = rows
  .filter((r) => r.wallet_address)
  .map((r) => String(r.wallet_address).toLowerCase());
const uniqueWallets = [...new Set(wallets)];

let output;
if (format === 'csv') {
  const headers = [
    'wallet_address',
    'email',
    'full_name',
    'referral_code',
    'referred_by',
    'source',
    'status',
    'eligible_for_tge',
    'created_at',
  ];
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  output = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
} else if (format === 'participants' || format === 'merkle') {
  // Compact address list for merkle / airdrop tooling
  output = JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      view: table,
      count: uniqueWallets.length,
      wallets: uniqueWallets,
      participants: rows.map((r) => ({
        wallet: r.wallet_address,
        email: r.email,
        name: r.full_name,
        referral_code: r.referral_code,
        status: r.status,
      })),
    },
    null,
    2,
  );
} else {
  output = JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      view: table,
      total_rows: rows.length,
      unique_wallets: uniqueWallets.length,
      rows,
    },
    null,
    2,
  );
}

if (outPath) {
  fs.writeFileSync(outPath, output, 'utf8');
  console.log(`Wrote ${rows.length} rows (${uniqueWallets.length} unique wallets) → ${outPath}`);
} else {
  process.stdout.write(output);
  if (!output.endsWith('\n')) process.stdout.write('\n');
}
