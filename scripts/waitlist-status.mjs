#!/usr/bin/env node
/**
 * Probe whether the waitlist database is ready.
 * Exit 0 if public.waitlist exists; exit 1 with setup instructions otherwise.
 *
 * Loads gami-web/.env.local and gami-web/.env when present.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(resolve(root, 'gami-web/.env.local'));
loadEnvFile(resolve(root, 'gami-web/.env'));

const PROJECT_REF = 'xetqhdzvbfeiedbmopew';
const url = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  `https://${PROJECT_REF}.supabase.co`
).replace(/\/$/, '');
const key =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!key) {
  console.error('Missing publishable key (VITE_SUPABASE_PUBLISHABLE_KEY).');
  process.exit(1);
}

const res = await fetch(`${url}/rest/v1/waitlist?select=id&limit=1`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
const text = await res.text();
const missing =
  text.includes('PGRST205') || text.includes("Could not find the table 'public.waitlist'");

if (!missing && (res.ok || res.status === 401 || res.status === 403)) {
  console.log('✓ public.waitlist is available');
  const stats = await fetch(`${url}/rest/v1/rpc/waitlist_public_stats`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  if (stats.ok) {
    console.log('✓ live stats:', await stats.text());
  } else {
    console.log('• waitlist_public_stats RPC not ready yet (re-run bootstrap if needed)');
  }
  process.exit(0);
}

console.error('✗ Waitlist schema missing:', text);
console.error(`
Apply the database once:

  1. https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new
  2. Paste supabase/bootstrap_waitlist.sql
  3. Run → wait 10s → npm run waitlist:status

Or:
  SUPABASE_ACCESS_TOKEN=sbp_... npm run waitlist:setup
`);
process.exit(1);
