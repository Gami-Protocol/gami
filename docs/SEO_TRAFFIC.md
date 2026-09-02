# Google + ChatGPT traffic setup

This repo ships crawlable SEO assets on the live Vercel project (`gami-web`):

| Asset | Purpose |
|-------|---------|
| `/robots.txt` | Allows Googlebot, GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot |
| `/sitemap.xml` | Google Search Console indexing map |
| `/llms.txt` | Short AI citation guide (ChatGPT / answer engines) |
| `/llms-full.txt` | Longer brand brief for assistants |
| Homepage FAQ + `FAQPage` JSON-LD | Google rich results + AI Q&A |
| Organization / WebSite / WebPage / SoftwareApplication schema | Knowledge graph signals |
| Static `<h1>` + canonical in `index.html` | Crawlable without JS |

## Live sitemap (submit this URL)

**Sitemap URL:** `https://gamiprotocol.io/sitemap.xml`

| URL | changefreq | priority |
|-----|------------|----------|
| https://gamiprotocol.io/ | weekly | 1.0 |
| https://gamiprotocol.io/foundation | monthly | 0.9 |
| https://gamiprotocol.io/about | monthly | 0.8 |
| https://gamiprotocol.io/agents | monthly | 0.8 |
| https://gamiprotocol.io/wallet | weekly | 0.9 |
| https://gamiprotocol.io/developers/docs | weekly | 0.8 |
| https://gamiprotocol.io/developers/mcp-client | monthly | 0.7 |
| https://gamiprotocol.io/developers/mcp-server | monthly | 0.7 |
| https://gamiprotocol.io/status | daily | 0.5 |
| https://gamiprotocol.io/waitlist | weekly | 0.9 |
| https://gamiprotocol.io/waitlist/live | daily | 0.6 |
| https://gamiprotocol.io/sale | weekly | 0.8 |
| https://gamiprotocol.io/tokenomics | monthly | 0.8 |
| https://gamiprotocol.io/whitepaper | monthly | 0.7 |
| https://gamiprotocol.io/legal/terms | yearly | 0.3 |
| https://gamiprotocol.io/legal/privacy | yearly | 0.3 |
| https://gamiprotocol.io/legal/risk | yearly | 0.3 |

## 1. Fix the certificate first

Safari “Connection Is Not Private” on `gamiprotocol.io` blocks Google and AI crawlers.
Remove Titan/Neo apex A records at Name.com (see `docs/DOMAIN_DNS.md`) so only Vercel
serves HTTPS. Until then, verify on https://gamiwebapp.vercel.app .

## 2. Google Search Console + `VITE_GOOGLE_SITE_VERIFICATION`

1. Open [Google Search Console](https://search.google.com/search-console)
2. Add property **URL prefix**: `https://gamiprotocol.io`
3. Choose **HTML tag** verification
4. Google shows something like:
   ```html
   <meta name="google-site-verification" content="PASTE_THIS_TOKEN" />
   ```
5. In **Vercel** → project `gamiwebapp` → **Settings → Environment Variables**:
   - Name: `VITE_GOOGLE_SITE_VERIFICATION`
   - Value: `PASTE_THIS_TOKEN` (the `content` value only — short alphanumeric, usually under ~50 chars)
   - Environments: Production (and Preview if you want)
   - **Do not** paste sitemap XML, full meta tags, or long URL lists. Invalid values are ignored at build time.
6. **Redeploy** Production (env vars are baked into `index.html` at build time)
7. Confirm the tag is live:
   ```bash
   curl -s https://gamiprotocol.io/ | rg -o 'google-site-verification" content="[^"]+"'
   ```
8. Click **Verify** in Search Console
9. **Sitemaps → Add a new sitemap** → enter: `sitemap.xml`
10. Use **URL Inspection** on `/`, `/waitlist`, `/wallet`, `/developers/docs`

Optional Bing: [Bing Webmaster Tools](https://www.bing.com/webmasters) → import from GSC.

## 3. ChatGPT / AI discovery

No special API key is required. Assistants that respect `llms.txt` and allowlisted
bots will pick up:

- https://gamiprotocol.io/llms.txt
- https://gamiprotocol.io/llms-full.txt

After DNS is healthy:

```bash
curl -sI https://gamiprotocol.io/llms.txt      # text/plain
curl -sI https://gamiprotocol.io/robots.txt   # allows GPTBot
curl -s https://gamiprotocol.io/llms.txt | head
```

In ChatGPT / Custom GPTs / enterprise knowledge, you can also **attach or paste**
`llms-full.txt` as trusted source material.

## 4. Content loops that grow traffic

1. Keep waitlist + wallet as primary CTAs (already on home / FAQ answers).
2. Share `/waitlist` and `/llms.txt` in social bios (X, Telegram, Discord).
3. Publish consistent brand facts — do not invent TVL / raise numbers.
4. After each major page launch, request indexing in Search Console.

## 5. Local check

```bash
cd gami-web
VITE_GOOGLE_SITE_VERIFICATION=test_token_123 npm run build
rg 'google-site-verification' dist/index.html
ls dist/robots.txt dist/sitemap.xml dist/llms.txt dist/llms-full.txt
```
