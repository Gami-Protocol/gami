#!/usr/bin/env bash
# Diagnose apex DNS / TLS for the Vercel custom domain.
# Usage: ./scripts/check-domain-dns.sh [domain]
set -euo pipefail

DOMAIN="${1:-gamiprotocol.io}"
VERCEL_ALIAS="${VERCEL_ALIAS:-gamiwebapp.vercel.app}"
FAIL=0

echo "== DNS A records for ${DOMAIN} =="
mapfile -t IPS < <(dig +short "${DOMAIN}" A | sort -u)
if [[ ${#IPS[@]} -eq 0 ]]; then
  echo "ERROR: no A records"
  exit 1
fi
printf '%s\n' "${IPS[@]}"

echo
echo "== TLS subject per A record (SNI=${DOMAIN}) =="
for ip in "${IPS[@]}"; do
  subject="$(
    echo | openssl s_client -connect "${ip}:443" -servername "${DOMAIN}" 2>/dev/null \
      | openssl x509 -noout -subject 2>/dev/null || true
  )"
  if [[ -z "${subject}" ]]; then
    echo "FAIL  ${ip}  (no certificate / connection failed)"
    FAIL=1
    continue
  fi
  if [[ "${subject}" == *"${DOMAIN}"* ]]; then
    echo "OK    ${ip}  ${subject}"
  else
    echo "FAIL  ${ip}  ${subject}"
    FAIL=1
  fi
done

echo
echo "== HTTP checks =="
alias_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "https://${VERCEL_ALIAS}/" || echo ERR)"
echo "Vercel alias  https://${VERCEL_ALIAS}/  -> ${alias_code}"
[[ "${alias_code}" == "200" ]] || FAIL=1

# Force each IP so round-robin cannot hide a bad host.
for ip in "${IPS[@]}"; do
  code="$(
    curl -sS -o /dev/null -w '%{http_code}' --max-time 15 \
      --resolve "${DOMAIN}:443:${ip}" "https://${DOMAIN}/" 2>/dev/null || echo ERR
  )"
  echo "Apex via ${ip}  https://${DOMAIN}/  -> ${code}"
  [[ "${code}" == "200" ]] || FAIL=1
done

echo
if [[ "${FAIL}" -ne 0 ]]; then
  echo "RESULT: FAIL — remove non-Vercel apex A records (see docs/DOMAIN_DNS.md)."
  exit 1
fi
echo "RESULT: OK — all apex A records present a valid cert and return HTTP 200."
