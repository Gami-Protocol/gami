# gamiprotocol.io DNS (Vercel)

## Status (2026-07-23)

| Endpoint | Result |
|----------|--------|
| `https://gamiwebapp.vercel.app` | OK — HTML + `/assets/*` load |
| GitHub / Vercel production deploy (`main`) | Success (no build failure) |
| `https://gamiprotocol.io` | **Intermittent TLS failure** — conflicting apex A records |
| `https://www.gamiprotocol.io` | Does not resolve |

Vercel is not failing to deploy. The custom domain fails when DNS round-robins to Neo.space / Titan hosts that present a `*.titan.email` certificate for `gamiprotocol.io`.

## Root cause

Authoritative DNS at Name.com (`ns*.name.com`) returns **seven** A records for the apex. Roughly half terminate on Vercel (valid Let’s Encrypt cert for `gamiprotocol.io`); the rest terminate on Titan/Neo site hosts:

| IP | Role | TLS for SNI `gamiprotocol.io` |
|----|------|-------------------------------|
| `76.76.21.21` | Vercel anycast | OK (`CN=gamiprotocol.io`, `server: Vercel`) |
| `216.150.1.1` | Vercel anycast | OK |
| `216.198.79.1` | Vercel anycast | OK |
| `44.219.244.211` | `neo-sites04.titan.email` | Fail (`CN=*.titan.email`) |
| `34.206.170.199` | Titan / Neo | Fail (`CN=*.titan.email`) |
| `107.23.157.161` | Titan / Neo | Fail (`CN=*.titan.email`) |
| `44.197.32.160` | Titan / Neo | Fail (`CN=*.titan.email`) |

Neo.space email is already configured correctly via MX:

- `mx0001.neo.space`
- `mx0002.neo.space`

Those MX records are enough for mail. Apex **A** records pointing at Titan website hosts break HTTPS for the marketing site.

## Fix (Name.com DNS)

1. Open the `gamiprotocol.io` zone at Name.com.
2. **Remove** apex A records for the four Titan/Neo IPs listed above.
3. **Keep** a single apex A record to Vercel — typically `76.76.21.21`. Confirm the exact value under Vercel → Project `gamiwebapp` → Settings → Domains → `gamiprotocol.io`.
4. **Add** `www` as a CNAME to the target Vercel shows (often `cname.vercel-dns.com`), then enable the www → apex (or apex → www) redirect in Vercel.
5. Do **not** remove Neo MX / SPF / verification TXT records unless you are migrating email.

## Verify

```bash
dig +short gamiprotocol.io A
# Expect only Vercel IP(s), e.g. 76.76.21.21

dig +short www.gamiprotocol.io CNAME

for ip in $(dig +short gamiprotocol.io A); do
  echo "== $ip =="
  echo | openssl s_client -connect "$ip:443" -servername gamiprotocol.io 2>/dev/null \
    | openssl x509 -noout -subject
done
# Every subject should be CN=gamiprotocol.io (not *.titan.email)

curl -I https://gamiprotocol.io
# HTTP/2 200, server: Vercel
```

Working production alias while DNS is corrected:

- https://gamiwebapp.vercel.app
