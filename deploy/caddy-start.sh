#!/bin/sh
# ==============================================================================
#  FindLink — Caddy container entrypoint
#
#  Takes the read-only Caddyfile, enables the optional bits configured
#  through environment variables, and starts Caddy.
#
#  DOMAIN      site address: "findlink.site" (HTTPS via Let's Encrypt)
#              or ":80" (plain HTTP — set by docker-compose when
#              CADDY_DOMAIN is empty in .env)
#  ACME_EMAIL  optional account email for Let's Encrypt expiry notices
# ==============================================================================
set -eu

CONFIG=/tmp/Caddyfile
cp /etc/caddy/Caddyfile "$CONFIG"

# 1) ACME account email (optional) — replaces the "#ACME_EMAIL" placeholder
#    comment in the global options block with a real "email ..." directive.
#    (Patterns tolerate leading indentation — busybox sed compatible.)
if [ -n "${ACME_EMAIL:-}" ]; then
        sed -i "s|^\([[:space:]]*\)#ACME_EMAIL[[:space:]]*$|\1email ${ACME_EMAIL}|" "$CONFIG"
fi

# 2) HSTS — only meaningful once a real domain (and HTTPS) is in use, so
#    browsers never get pinned to https://<bare VPS IP> during setup.
case "${DOMAIN:-:80}" in
:*) ;; # plain-HTTP mode — leave the HSTS line commented
*) sed -i "s|^\([[:space:]]*\)#HSTS |\1|" "$CONFIG" ;;
esac

# 3) www <-> apex canonical redirect. With a real domain, Caddy must serve
#    BOTH hostnames or https://www.<domain> fails the TLS handshake with
#    ERR_SSL_PROTOCOL_ERROR (the Caddyfile only lists the apex host, but
#    DNS points www at the same VPS — README Step 4). Appending a redirect
#    site block makes Caddy provision a free Let's Encrypt certificate for
#    www as well and 301 every www URL to the canonical apex host, so short
#    links and SEO stay consistent. Requires the www DNS record to point
#    at this server (A or CNAME — both already work).
case "${DOMAIN:-:80}" in
:*) ;; # plain-HTTP mode — no canonical host, no redirect
www.*)
        # User made www the canonical host: redirect apex → www
        apex="${DOMAIN#www.}"
        printf '\n%s {\n\tredir https://www.%s{uri} permanent\n}\n' "$apex" "$apex" >> "$CONFIG"
        ;;
*)
        # Canonical apex host: redirect www → apex
        printf '\nwww.%s {\n\tredir https://%s{uri} permanent\n}\n' "$DOMAIN" "$DOMAIN" >> "$CONFIG"
        ;;
esac

exec caddy run --config "$CONFIG" --adapter caddyfile
