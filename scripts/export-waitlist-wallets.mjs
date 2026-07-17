#!/usr/bin/env node
/**
 * Export waitlist wallets from Supabase for TGE token distribution.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/export-waitlist-wallets.mjs
 *   node scripts/export-waitlist-wallets.mjs --format csv --out ./waitlist-wallets.csv
 *
 * Env:
 *   SUPABASE_URL                 Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY    Service role key (required for full export)
 *
 * Output columns: wallet_address, email, full_name, referral_code, source, status, created_at
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

function flag(name, fallback) {
  const idx = args.indexOf(name);
  if (idx === -1) return fallback;
  return args[idx + 1] ?? fallback;
}

const format = (flag('--format', 'json') || 'json').toLowerCase();
const outPath = flag('--out', null);
const includeEmailOnly = args.includes('--include-email-only');

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(
  /\/$/,
  '',
);
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    'Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role recommended for export).',
  );
  process.exit(1);
}

const select = includeEmailOnly
  ? 'id,email,full_name,wallet_address,referral_code,source,status,created_at,updated_at'
  : 'id,email,full_name,wallet_address,referral_code,source,status,created_at,updated_at';

const endpoint = includeEmailOnly
  ? `${supabaseUrl}/rest/v1/waitlist?select=${encodeURIComponent(select)}&order=created_at.asc`
  : `${supabaseUrl}/rest/v1/waitlist_distribution?select=${encodeURIComponent(select)}&order=created_at.asc`;

const res = await fetch(endpoint, {
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Accept: 'application/json',
  },
});

if (!res.ok) {
  console.error('Export failed:', res.status, await res.text());
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
    'source',
    'status',
    'created_at',
  ];
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  output = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => escape(r[h])).join(','),
    ),
  ].join('\n');
} else if (format === 'wallets') {
  output = JSON.stringify(uniqueWallets, null, 2);
} else if (format === 'participants') {
  // Shape compatible with gami-contracts/scripts/merkle-whitelist.ts PARTICIPANTS_JSON
  output = JSON.stringify(
    uniqueWallets.map((wallet_address) => ({
      wallet_address,
      kyc_status: 'approved',
    })),
    null,
    2,
  );
} else {
  output = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      total_rows: rows.length,
      wallets_with_address: uniqueWallets.length,
      rows,
      wallets: uniqueWallets,
    },
    null,
    2,
  );
}

if (outPath) {
  const abs = path.resolve(outPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${output}\n`, 'utf8');
  console.log(`Wrote ${rows.length} rows (${uniqueWallets.length} wallets) → ${abs}`);
} else {
  process.stdout.write(`${output}\n`);
}
