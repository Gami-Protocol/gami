/**
 * 410 Gone for permanently withdrawn routes.
 *
 * gamiprotocol.io is a static SPA behind a catch-all rewrite to index.html, so
 * every path would otherwise answer 200 with the app shell. Withdrawn routes are
 * rewritten here instead (see vercel.json) so crawlers receive an explicit
 * "intentionally removed" signal and de-index quickly.
 *
 * 410 rather than 404: 404 reads as "maybe temporary" and lingers in the index.
 * 410 rather than a redirect: redirecting would carry the withdrawn page's
 * inbound link signal onto whatever it pointed at.
 *
 * These routes must not be restored without written legal clearance.
 * See docs/legal-hold/2026-09-09-token-sale-surface/MANIFEST.md.
 */

const BODY = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Page removed — Gami Protocol</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0; min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: #0E0E12; color: #fff;
    font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    padding: 24px;
  }
  main { max-width: 34rem; }
  h1 { font-size: 1.5rem; margin: 0 0 1rem; letter-spacing: -0.01em; }
  p { color: #b6b6c2; margin: 0 0 1rem; }
  a { color: #A78BFA; }
</style>
</head>
<body>
  <main>
    <h1>This page has been removed</h1>
    <p>This page is no longer published and will not be restored at this address.</p>
    <p>Gami Protocol is onchain loyalty infrastructure: XP, quests and
       stablecoin-settled rewards on Base.</p>
    <p><a href="/">Go to the homepage</a> &middot; <a href="/developers/docs">Read the docs</a></p>
  </main>
</body>
</html>
`;

module.exports = (req, res) => {
  res.statusCode = 410;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, must-revalidate');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(BODY);
};
