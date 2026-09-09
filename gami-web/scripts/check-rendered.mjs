#!/usr/bin/env node
/**
 * Rendered-DOM compliance gate.
 *
 * gamiprotocol.io is an SPA: the served HTML is an empty shell and every word a
 * crawler indexes appears only after hydration. Scanning bundled source or the
 * shell would therefore call the site clean while the homepage still published
 * the copy Google actually indexed. This renders every route in a real browser
 * and scans what the DOM ends up containing.
 *
 * Scans, per route: visible text, document title, every meta/OG value, and all
 * JSON-LD. Deliberately NOT class names or bundled identifiers -- those are not
 * published copy.
 *
 * Also asserts every withdrawn route answers 410 and that no reachable page
 * links to one.
 *
 * Usage:  node scripts/check-rendered.mjs [baseUrl]
 * Set PLAYWRIGHT_CHROMIUM_PATH to use a preinstalled browser.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const config = JSON.parse(
  readFileSync(join(repoRoot, 'scripts', 'forbidden-phrases.json'), 'utf8'),
);
const PATTERNS = config.patterns.map((p) => ({ ...p, re: new RegExp(p.source, 'i') }));
const MAX_META = config.maxMetaValueLength;
const WITHDRAWN = config.withdrawnRoutes.routes;

const BASE = (process.argv[2] ?? 'http://127.0.0.1:4173').replace(/\/$/, '');

/** Every route a crawler can reach. Keep in step with src/App.tsx. */
const ROUTES = [
  '/', '/about', '/agents', '/foundation', '/wallet', '/wallet/guide', '/app',
  '/get-app', '/partners', '/settlement', '/base', '/developers/docs', '/developers/mcp-client',
  '/developers/mcp-server', '/status', '/waitlist', '/waitlist/live',
  '/legal/terms', '/legal/privacy',
];

const failures = [];
const fail = (where, detail) => failures.push({ where, detail });

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
});
const page = await browser.newPage();

for (const route of ROUTES) {
  // Not networkidle: the wallet SDK holds connections open, so it never fires.
  // Wait for the SPA to actually paint, then let a beat of hydration settle.
  const res = await page.goto(`${BASE}${route}`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  if (!res || res.status() >= 400) {
    fail(route, `expected a rendered page, got HTTP ${res?.status() ?? 'no response'}`);
    continue;
  }
  try {
    await page.waitForFunction(() => (document.body?.innerText ?? '').trim().length > 100, {
      timeout: 20_000,
    });
  } catch {
    fail(route, 'rendered no text within 20s — a crawler would see an empty page');
    continue;
  }
  await page.waitForTimeout(600);

  const harvested = await page.evaluate(() => ({
    text: document.body?.innerText ?? '',
    title: document.title,
    metas: [...document.querySelectorAll('meta')].map((m) => ({
      name: m.getAttribute('name') ?? m.getAttribute('property') ?? '(unnamed)',
      content: m.getAttribute('content') ?? '',
    })),
    jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
      (s) => s.textContent ?? '',
    ),
    links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') ?? ''),
  }));

  const surfaces = [
    ['visible text', harvested.text],
    ['title', harvested.title],
    ...harvested.metas.map((m) => [`meta[${m.name}]`, m.content]),
    ...harvested.jsonLd.map((j, i) => [`json-ld[${i}]`, j]),
  ];

  for (const [label, value] of surfaces) {
    for (const p of PATTERNS) {
      const m = p.re.exec(value);
      if (m) fail(route, `${label} matches "${p.id}" (${JSON.stringify(m[0])}) — ${p.why}`);
    }
  }

  for (const m of harvested.metas) {
    if (m.content.length > MAX_META) {
      fail(route, `meta[${m.name}] is ${m.content.length} chars (max ${MAX_META})`);
    }
  }

  for (const href of harvested.links) {
    const path = href.replace(BASE, '').split(/[?#]/)[0].replace(/\/$/, '') || '/';
    if (WITHDRAWN.includes(path)) fail(route, `links withdrawn route ${path}`);
  }
}

// Withdrawn routes must be gone, not merely unlinked.
for (const route of WITHDRAWN) {
  const res = await page.request.get(`${BASE}${route}`, { maxRedirects: 0 });
  if (res.status() !== 410) {
    fail(route, `expected HTTP 410 Gone, got ${res.status()} — restoring these needs legal clearance`);
  }
}

await browser.close();

if (failures.length) {
  console.error(`\n✗ rendered-DOM compliance gate: ${failures.length} failure(s)\n`);
  for (const f of failures) console.error(`  ${f.where}\n      ${f.detail}`);
  console.error(
    '\nThis gate scans the hydrated DOM because that is what Google indexes.\n' +
      'See scripts/forbidden-phrases.json and docs/legal-hold/.\n',
  );
  process.exit(1);
}
console.log(`✓ rendered-DOM compliance gate passed (${ROUTES.length} routes, ${WITHDRAWN.length} withdrawn routes 410)`);
