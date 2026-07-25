# Google + ChatGPT traffic setup

This repo ships crawlable SEO assets on the live Vercel project (`gami-web`):

| Asset | Purpose |
|-------|---------|
| `/robots.txt` | Allows Googlebot, GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot |
| `/sitemap.xml` | Google Search Console indexing map |
| `/llms.txt` | Short AI citation guide (ChatGPT / answer engines) |
| `/llms-full.txt` | Longer brand brief for assistants |
| Homepage FAQ + `FAQPage` JSON-LD | Google rich results + AI Q&A |
| Organization / WebSite / SoftwareApplication schema | Knowledge graph signals |

## 1. Fix the certificate first

Safari “Connection Is Not Private” on `gamiprotocol.io` blocks Google and AI crawlers.
Remove Titan/Neo apex A records at Name.com (see `docs/DOMAIN_DNS.md`) so only Vercel
serves HTTPS. Until then, verify on https://gamiwebapp.vercel.app .

## 2. Google Search Console

1. Open [Google Search Console](https://search.google.com/search-console)
2. Add property `https://gamiprotocol.io`
3. Paste the verification token into Vercel env as `VITE_GOOGLE_SITE_VERIFICATION`
4. Redeploy, then verify ownership
5. Submit sitemap: `https://gamiprotocol.io/sitemap.xml`
6. Use **URL Inspection** on `/`, `/waitlist`, `/wallet`, `/developers/docs`

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
cd gami-web && npm run build
ls dist/robots.txt dist/sitemap.xml dist/llms.txt dist/llms-full.txt
```
