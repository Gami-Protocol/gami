#!/usr/bin/env node
/**
 * Static compliance gate for the marketing site.
 *
 * Checks the artefacts a crawler can fetch without running JavaScript:
 *   - dist/index.html          meta, Open Graph, Twitter cards, inline JSON-LD
 *   - public/sitemap.xml       must list no withdrawn route
 *   - public/robots.txt        must disallow every withdrawn route
 *   - public/llms*.txt         served verbatim to AI crawlers
 *   - src/**                   internal <Link to>/href targets and route table
 *
 * The rendered DOM of an SPA is checked separately by check-rendered.mjs.
 * Scanning source alone would miss copy that only exists after hydration, so
 * both gates must pass. Run from gami-web/.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, '..');
const repoRoot = join(webRoot, '..');

const config = JSON.parse(
  readFileSync(join(repoRoot, 'scripts', 'forbidden-phrases.json'), 'utf8'),
);
const PATTERNS = config.patterns.map((p) => ({ ...p, re: new RegExp(p.source, 'i') }));
const WITHDRAWN = config.withdrawnRoutes.routes;
const MAX_META = config.maxMetaValueLength;

const failures = [];
const fail = (where, detail) => failures.push({ where, detail });

/** Strip tags so we scan published copy, not markup or class names. */
function textOf(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (m) =>
      / type=["']application\/ld\+json["']/i.test(m) ? m : ' ',
    )
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

function scanPhrases(where, text) {
  for (const p of PATTERNS) {
    const m = p.re.exec(text);
    if (m) fail(where, `matches "${p.id}" (${JSON.stringify(m[0])}) — ${p.why}`);
  }
}

// ---- dist/index.html -------------------------------------------------------
const distIndex = join(webRoot, 'dist', 'index.html');
if (!existsSync(distIndex)) {
  fail('dist/index.html', 'missing — run `npm run build` before this check');
} else {
  const html = readFileSync(distIndex, 'utf8');
  scanPhrases('dist/index.html', textOf(html));

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const content = /content=["']([^"']*)["']/i.exec(tag)?.[1];
    if (content == null) continue;
    const name = /(?:name|property)=["']([^"']*)["']/i.exec(tag)?.[1] ?? '(unnamed)';
    if (content.length > MAX_META) {
      fail('dist/index.html', `meta "${name}" is ${content.length} chars (max ${MAX_META})`);
    }
    if (/^\s*$/.test(content) && name === 'google-site-verification') {
      fail('dist/index.html', 'google-site-verification is empty');
    }
  }

  for (const route of WITHDRAWN) {
    if (new RegExp(`["'\\s(]${route}["'\\s)?#]`).test(html)) {
      fail('dist/index.html', `references withdrawn route ${route}`);
    }
  }
}

// ---- sitemap ---------------------------------------------------------------
const sitemapPath = join(webRoot, 'public', 'sitemap.xml');
const sitemap = readFileSync(sitemapPath, 'utf8');
scanPhrases('public/sitemap.xml', sitemap);
for (const route of WITHDRAWN) {
  if (sitemap.includes(`gamiprotocol.io${route}<`) || sitemap.includes(`gamiprotocol.io${route}/`)) {
    fail('public/sitemap.xml', `lists withdrawn route ${route}`);
  }
}

// ---- robots ----------------------------------------------------------------
const robots = readFileSync(join(webRoot, 'public', 'robots.txt'), 'utf8');
for (const route of ['/sale', '/tokenomics', '/whitepaper', '/legal/risk']) {
  if (!new RegExp(`^Disallow:\\s*${route}\\s*$`, 'im').test(robots)) {
    fail('public/robots.txt', `does not disallow withdrawn route ${route}`);
  }
}

// ---- llms briefs -----------------------------------------------------------
for (const name of ['llms.txt', 'llms-full.txt']) {
  const p = join(webRoot, 'public', name);
  if (!existsSync(p)) continue;
  const raw = readFileSync(p, 'utf8');
  // "Do not state" sections deliberately name the forbidden things; scan only
  // the assertions above them.
  const assertions = raw.split(/^##\s+Do not state\s*$/im)[0].split(
    /^##\s+Accuracy notes for assistants\s*$/im,
  )[0];
  scanPhrases(`public/${name}`, assertions);
  for (const route of WITHDRAWN) {
    if (raw.includes(`gamiprotocol.io${route}`)) {
      fail(`public/${name}`, `links withdrawn route ${route}`);
    }
  }
}

// ---- source: internal links and the route table ---------------------------
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(full)) out.push(full);
  }
  return out;
}
for (const file of walk(join(webRoot, 'src'))) {
  const src = readFileSync(file, 'utf8');
  const rel = relative(webRoot, file);
  for (const route of WITHDRAWN) {
    const linked = new RegExp(`(?:to|href)=["']${route}["']`).test(src);
    const routed = new RegExp(`<Route\\s+path=["']${route}["']`).test(src);
    if (linked) fail(rel, `links withdrawn route ${route} — it returns 410`);
    if (routed) fail(rel, `declares a route for withdrawn path ${route}`);
  }
}

// ---- SEO route descriptions ------------------------------------------------
const seoSrc = readFileSync(join(webRoot, 'src', 'lib', 'seo.ts'), 'utf8');
scanPhrases('src/lib/seo.ts', seoSrc);
for (const [, value] of seoSrc.matchAll(/(?:title|description):\s*\n?\s*'((?:[^'\\]|\\.)*)'/g)) {
  if (value.length > MAX_META) {
    fail('src/lib/seo.ts', `entry is ${value.length} chars (max ${MAX_META}): ${value.slice(0, 60)}…`);
  }
}

// ---- report ----------------------------------------------------------------
if (failures.length) {
  console.error(`\n✗ static compliance gate: ${failures.length} failure(s)\n`);
  for (const f of failures) console.error(`  ${f.where}\n      ${f.detail}`);
  console.error(
    '\nThese rules exist because a token-sale funnel was published and indexed.\n' +
      'See scripts/forbidden-phrases.json and docs/legal-hold/.\n',
  );
  process.exit(1);
}
console.log('✓ static compliance gate passed');
