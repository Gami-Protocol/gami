#!/usr/bin/env node
/**
 * Compliance gate for the LIVE site.
 *
 * check-static.mjs and check-rendered.mjs prove the build is clean. Neither
 * proves the clean build is the one being served. The Search Console fix made
 * that distinction expensive: it merged, every gate passed, and the production
 * deployment then failed to provision. For a day and a half gamiprotocol.io
 * kept serving the previous build — which published the withdrawn route
 * inventory inside a meta tag — while the repository, and CI, said the problem
 * was fixed.
 *
 * So this gate asks the live origin, over the public internet, the questions
 * that actually matter to a regulator and to Google:
 *
 *   - are the withdrawn routes returning 410 Gone?
 *   - is the served HTML free of the forbidden phrases?
 *   - is the verification meta tag a token, and not something pasted into it?
 *   - do robots.txt and sitemap.xml still exclude the withdrawn routes?
 *   - and is the commit being served the commit we think is deployed?
 *
 * Usage:
 *   node scripts/check-production.mjs [--expect-commit=<sha>] [--wait=<seconds>]
 *
 * --expect-commit makes the run assert the deployed commit, polling until
 * --wait elapses so it can be used straight after a merge, while the platform
 * is still building. Without it the commit is reported and not enforced.
 *
 * Environment: GAMI_SITE_URL overrides the origin (default https://gamiprotocol.io).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');

const config = JSON.parse(
  readFileSync(join(repoRoot, 'scripts', 'forbidden-phrases.json'), 'utf8'),
);
const PATTERNS = config.patterns.map((p) => ({ ...p, re: new RegExp(p.source, 'i') }));
const WITHDRAWN = config.withdrawnRoutes.routes;
const MAX_META = config.maxMetaValueLength;
const MAX_VERIFICATION_TOKEN_LENGTH = 100;

const ORIGIN = (process.env.GAMI_SITE_URL || 'https://gamiprotocol.io').replace(/\/$/, '');

const args = process.argv.slice(2);
const argValue = (name) =>
  args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const EXPECT_COMMIT = argValue('expect-commit');
const WAIT_SECONDS = Number(argValue('wait') ?? 0);

/** Live routes that must keep answering 200 — a takedown that takes the site down is also a failure. */
const LIVE_ROUTES = [
  '/',
  '/about',
  '/agents',
  '/wallet',
  '/waitlist',
  '/settlement',
  '/base',
  '/partners',
  '/developers/docs',
  '/legal/terms',
  '/legal/privacy',
];

const failures = [];
const notes = [];
const fail = (where, detail) => failures.push({ where, detail });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * A single failed request proves nothing about the site — transport errors and
 * empty bodies happen. Only a repeated result is evidence, so every fetch is
 * retried before its outcome is believed.
 */
async function request(path, { attempts = 4, redirect = 'manual' } = {}) {
  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`${ORIGIN}${path}`, {
        redirect,
        headers: { 'User-Agent': 'gami-compliance-gate' },
        signal: AbortSignal.timeout(30_000),
      });
      const body = await res.text();
      last = { status: res.status, body, headers: res.headers, error: null };
      // Treat a suspiciously short body for an HTML route as a truncated
      // response rather than as the page: a 14-byte reply once read as "the
      // tag is gone" and it was an SSO redirect stub.
      const looksTruncated =
        res.status === 200 && path.endsWith('/') === false && body.length === 0;
      if (!looksTruncated) return last;
    } catch (err) {
      last = { status: 0, body: '', headers: new Headers(), error: String(err) };
    }
    if (i < attempts - 1) await sleep(1500 * (i + 1));
  }
  return last;
}

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

function checkMetaTags(where, html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const content = /content=["']([^"']*)["']/i.exec(tag)?.[1];
    if (content == null) continue;
    const name = /(?:name|property)=["']([^"']*)["']/i.exec(tag)?.[1] ?? '(unnamed)';
    if (content.length > MAX_META) {
      fail(where, `meta "${name}" is ${content.length} chars (max ${MAX_META})`);
    }
    if (name === 'google-site-verification') {
      if (!/^[A-Za-z0-9_-]+$/.test(content) || content.length > MAX_VERIFICATION_TOKEN_LENGTH) {
        fail(
          where,
          `google-site-verification is not a valid token (${content.length} chars). ` +
            'A pasted sitemap once shipped here and published the withdrawn routes. ' +
            'Fix VITE_GOOGLE_SITE_VERIFICATION in the deployment environment.',
        );
      }
    }
  }
}

// ---- deployed commit -------------------------------------------------------
async function checkDeployedCommit() {
  const deadline = Date.now() + WAIT_SECONDS * 1000;
  let seen = null;

  for (;;) {
    const res = await request('/version.json');
    if (res.status === 200) {
      try {
        seen = JSON.parse(res.body);
      } catch {
        seen = null;
      }
    }

    if (!EXPECT_COMMIT) {
      if (seen?.commit) notes.push(`serving commit ${seen.commit} (built ${seen.builtAt})`);
      else notes.push('/version.json not served yet — deployed commit unknown');
      return;
    }

    if (seen?.commit && seen.commit.startsWith(EXPECT_COMMIT.slice(0, 7))) {
      notes.push(`serving the expected commit ${seen.commit}`);
      return;
    }

    if (Date.now() >= deadline) {
      fail(
        '/version.json',
        `expected commit ${EXPECT_COMMIT} but the live site is serving ` +
          `${seen?.commit ?? 'no version stamp'}. The merge has not reached ` +
          'production — check the deployment for a failed build.',
      );
      return;
    }
    await sleep(20_000);
  }
}

// ---- withdrawn routes ------------------------------------------------------
async function checkWithdrawnRoutes() {
  for (const route of WITHDRAWN) {
    const res = await request(route);
    if (res.status !== 410) {
      fail(
        route,
        `returned ${res.status || `no response (${res.error})`}, expected 410 Gone. ` +
          'A withdrawn route answering anything else is live surface.',
      );
    }
  }
}

// ---- live routes -----------------------------------------------------------
async function checkLiveRoutes() {
  for (const route of LIVE_ROUTES) {
    const res = await request(route);
    if (res.status !== 200) {
      fail(route, `returned ${res.status || `no response (${res.error})`}, expected 200`);
      continue;
    }
    // The served HTML is an SPA shell: its <head> is the whole crawlable
    // surface until hydration, and it is where the leak happened.
    checkMetaTags(route, res.body);
    scanPhrases(`${route} (served HTML)`, textOf(res.body));
  }
}

// ---- crawler-facing files --------------------------------------------------
async function checkCrawlerFiles() {
  const sitemap = await request('/sitemap.xml');
  if (sitemap.status !== 200) {
    fail('/sitemap.xml', `returned ${sitemap.status || `no response (${sitemap.error})`}`);
  } else {
    for (const route of WITHDRAWN) {
      if (sitemap.body.includes(`${route}<`) || sitemap.body.includes(`${route}/<`)) {
        fail('/sitemap.xml', `still lists the withdrawn route ${route}`);
      }
    }
    scanPhrases('/sitemap.xml', sitemap.body);
  }

  const robots = await request('/robots.txt');
  if (robots.status !== 200) {
    fail('/robots.txt', `returned ${robots.status || `no response (${robots.error})`}`);
  } else {
    // Disallow is a prefix rule, so "Disallow: /sale" already covers
    // /sale/contribute and /sale/kyc. Requiring a line per route would
    // manufacture failures against a correct file.
    const disallowed = [...robots.body.matchAll(/^\s*Disallow:\s*(\S+)\s*$/gim)].map(
      (m) => m[1],
    );
    for (const route of WITHDRAWN) {
      const covered = disallowed.some((rule) => route === rule || route.startsWith(rule));
      if (!covered) fail('/robots.txt', `does not disallow the withdrawn route ${route}`);
    }
  }

  for (const file of ['/llms.txt', '/llms-full.txt']) {
    const res = await request(file);
    if (res.status !== 200) {
      fail(file, `returned ${res.status || `no response (${res.error})`}`);
      continue;
    }
    // The "Do not state" and "Accuracy notes" sections name the forbidden
    // things on purpose — they are the disclaimer. Scan the assertions above
    // them, exactly as check-static.mjs does for the same files.
    const assertions = res.body
      .split(/^##\s+Do not state\s*$/im)[0]
      .split(/^##\s+Accuracy notes for assistants\s*$/im)[0];
    scanPhrases(file, assertions);
    for (const route of WITHDRAWN) {
      if (res.body.includes(`gamiprotocol.io${route}`)) {
        fail(file, `links the withdrawn route ${route}`);
      }
    }
  }
}

// ---- run -------------------------------------------------------------------
console.log(`Checking live site: ${ORIGIN}\n`);

await checkDeployedCommit();
await checkWithdrawnRoutes();
await checkLiveRoutes();
await checkCrawlerFiles();

for (const note of notes) console.log(`  note: ${note}`);

if (failures.length > 0) {
  console.error(`\n${failures.length} production compliance failure(s):\n`);
  for (const f of failures) console.error(`  ${f.where}\n    ${f.detail}\n`);
  console.error(
    'The live site does not match the compliance requirements. This is a\n' +
      'published-state problem, not a build problem: fixing the repository is\n' +
      'not enough, the fix has to be deployed.\n',
  );
  process.exit(1);
}

console.log(`\nLive site clean: ${WITHDRAWN.length} withdrawn routes gone, ${LIVE_ROUTES.length} live routes serving.`);
