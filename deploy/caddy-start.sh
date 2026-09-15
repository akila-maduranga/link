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

exec caddy run --config "$CONFIG" --adapter caddyfile
