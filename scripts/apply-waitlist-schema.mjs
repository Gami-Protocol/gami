#!/usr/bin/env node
/**
 * Apply supabase/bootstrap_waitlist.sql
 *
 * Option A — Management API (personal access token):
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-waitlist-schema.mjs
 *
 * Option B — Direct Postgres:
 *   DATABASE_URL='postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres' \
 *     node scripts/apply-waitlist-schema.mjs
 *
 * Option C — Dashboard (no credentials in CI):
 *   Paste supabase/bootstrap_waitlist.sql into the SQL Editor and Run.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const PROJECT_REF = 'xetqhdzvbfeiedbmopew';
const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(__dirname, '../supabase/bootstrap_waitlist.sql');
const sql = readFileSync(sqlPath, 'utf8');

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

function printManualSteps() {
  console.error(`
Missing credentials to apply schema automatically.

Run this once in the Supabase SQL Editor (recommended):
  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new

Paste file:
  supabase/bootstrap_waitlist.sql

Then wait ~10s for the API schema cache, or click "Reload schema" if available.

Automated options:
  SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-waitlist-schema.mjs
  DATABASE_URL='postgresql://...' node scripts/apply-waitlist-schema.mjs
`);
}

async function applyViaManagementApi() {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${text}`);
  }
  console.log('✓ Applied bootstrap via Supabase Management API');
  console.log(text.slice(0, 500));
}

async function applyViaPostgres() {
  const require = createRequire(import.meta.url);
  let Client;
  try {
    ({ Client } = require('pg'));
  } catch {
    throw new Error(
      'Package "pg" is not installed. Run: npm install pg --no-save\nOr use SUPABASE_ACCESS_TOKEN / SQL Editor instead.',
    );
  }
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    console.log('✓ Applied bootstrap via DATABASE_URL');
  } finally {
    await client.end();
  }
}

async function main() {
  if (accessToken) {
    await applyViaManagementApi();
    return;
  }
  if (databaseUrl) {
    await applyViaPostgres();
    return;
  }
  printManualSteps();
  process.exit(1);
}

main().catch((err) => {
  console.error('Failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
