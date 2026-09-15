#!/usr/bin/env bash
# ==============================================================================
#  FindLink (findlink.site) — one-command installer
#
#  Usage (from a cloned repo):
#      ./install.sh [--domain findlink.site] [--resend-key re_xxx]
#                    [--email you@example.com] [--image ghcr.io/USER/findlink:latest]
#                    [--port 3000]
#
#  Usage (via curl — pass the repo URL):
#      curl -fsSL https://raw.githubusercontent.com/USER/REPO/main/install.sh \
#          | bash -s -- --repo https://github.com/USER/REPO.git --domain findlink.site
#
#  Options:
#      --repo URL       Git repository to clone (required when piped via curl)
#      --domain   FQDN  Your domain, e.g. findlink.site (sets APP_URL and
#                       enables automatic HTTPS via the built-in Caddy proxy)
#      --resend-key KEY Resend API key for sending emails
#      --email    ADDR  Let's Encrypt account email (expiry notices)
#      --image    NAME  Use a PREBUILT image instead of building on the VPS
#                       (strongly recommended for 512 MB VPS — see README).
#                       Auto-detected from your GitHub remote when possible.
#      --port     N     Host port for local debug access (default 3000)
#      --update         Pull latest code, rebuild and restart (keeps .env & data)
#      --yes            Assume yes for prompts (non-interactive)
# ==============================================================================
set -euo pipefail

BOLD="\033[1m"; GREEN="\033[32m"; CYAN="\033[36m"; YELLOW="\033[33m"; RED="\033[31m"; DIM="\033[2m"; RESET="\033[0m"
say()  { echo -e "${CYAN}▸${RESET} $*"; }
ok()   { echo -e "${GREEN}✓${RESET} $*"; }
warn() { echo -e "${YELLOW}!${RESET} $*"; }
die()  { echo -e "${RED}✗ ERROR:${RESET} $*" >&2; exit 1; }
banner() {
  echo -e "${BOLD}"
  echo "  ┌─────────────────────────────────────────────┐"
  echo "  │   F I N D L I N K                          │"
  echo "  │   findlink.site                             │"
  echo "  │   Link directory + URL shortener            │"
  echo "  │   optimized for tiny VPS (512 MB)           │"
  echo "  └─────────────────────────────────────────────┘"
  echo -e "${RESET}"
}

REPO_URL=""; DOMAIN=""; RESEND_KEY=""; ACME_EMAIL=""; IMAGE_ARG=""; PORT="3000"; ASSUME_YES="false"; UPDATE="false"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO_URL="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --resend-key) RESEND_KEY="$2"; shift 2 ;;
    --email) ACME_EMAIL="$2"; shift 2 ;;
    --image) IMAGE_ARG="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --update) UPDATE="true"; shift ;;
    --yes|-y) ASSUME_YES="true"; shift ;;
    *) die "Unknown option: $1" ;;
  esac
done

confirm() {
  [[ "$ASSUME_YES" == "true" ]] && return 0
  read -r -p "$1 [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]]
}

banner

# ------------------------------------------------------------------------------
# 1. Locate the source code
# ------------------------------------------------------------------------------
if [[ -f "docker-compose.yml" && -f "Dockerfile" ]]; then
  APP_DIR="$(pwd)"
  say "Running inside the repository: ${APP_DIR}"
elif [[ -n "$REPO_URL" ]]; then
  APP_DIR="$HOME/findlink"
  say "Cloning ${REPO_URL} → ${APP_DIR}"
  if [[ -d "$APP_DIR/.git" ]]; then
    git -C "$APP_DIR" fetch --all --quiet && git -C "$APP_DIR" reset --hard origin/HEAD --quiet
  else
    rm -rf "$APP_DIR"
    git clone --depth 1 "$REPO_URL" "$APP_DIR"
  fi
else
  die "Not inside the FindLink repo and no --repo URL given.
     Either:  git clone https://github.com/USER/REPO && cd REPO && ./install.sh
     Or:      curl ... install.sh | bash -s -- --repo https://github.com/USER/REPO.git"
fi
cd "$APP_DIR"

# ------------------------------------------------------------------------------
# 2. Docker present? (install if missing on Ubuntu/Debian)
# ------------------------------------------------------------------------------
if command -v docker >/dev/null 2>&1; then
  ok "Docker found: $(docker --version | cut -d, -f1)"
else
  warn "Docker is not installed."
  if confirm "Install Docker now (via get.docker.com)?"; then
    curl -fsSL https://get.docker.com | sh
    ok "Docker installed"
  else
    die "Docker is required. Install it from https://docs.docker.com and re-run."
  fi
fi

if ! docker compose version >/dev/null 2>&1; then
  die "Docker Compose v2 is required (apt install docker-compose-plugin)."
fi

# Make sure we can talk to the daemon (root or docker group)
if ! docker info >/dev/null 2>&1; then
  if command -v sudo >/dev/null 2>&1; then
    say "Re-running with sudo…"
    exec sudo bash "$0" "$@"
  else
    die "Cannot access the Docker daemon (are you root / in the docker group?)."
  fi
fi

# ------------------------------------------------------------------------------
# 3. Swap check — 512 MB VPS needs ~2 GB swap to survive the Docker BUILD step
# ------------------------------------------------------------------------------
total_mb=$(( $(awk '/MemTotal/ {print $2}' /proc/meminfo) / 1024 ))
swap_mb=$(( $(awk '/SwapTotal/ {print $2}' /proc/meminfo) / 1024 ))
if (( total_mb < 1200 && swap_mb < 1900 )); then
  warn "Low RAM (${total_mb} MB) and little swap (${swap_mb} MB)."
  warn "~2 GB swap is strongly recommended — the Docker build step needs it."
  if confirm "Create/extend swap to ~2 GB now?"; then
    if [[ ! -f /swapfile ]]; then
      dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
      chmod 600 /swapfile
      mkswap /swapfile
      swapon /swapfile
      grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    elif (( swap_mb < 1900 )); then
      # Growing an active swap file requires swapoff (risky on 512 MB) —
      # add a second file instead; Linux happily uses both.
      say "/swapfile exists — adding /swapfile2 (1 GB) alongside it…"
      dd if=/dev/zero of=/swapfile2 bs=1M count=1024 status=progress
      chmod 600 /swapfile2
      mkswap /swapfile2
      swapon /swapfile2
      grep -q '/swapfile2' /etc/fstab || echo '/swapfile2 none swap sw 0 0' >> /etc/fstab
    fi
    echo 'vm.swappiness=10' > /etc/sysctl.d/99-findlink-swap.conf
    sysctl -p /etc/sysctl.d/99-findlink-swap.conf >/dev/null
    ok "Swap enabled ($(awk '/SwapTotal/ {print $2}' /proc/meminfo | awk '{print $1/1024}') MB total)"
  else
    warn "Continuing without swap — the build may fail or hang with OOM."
  fi
fi

# ------------------------------------------------------------------------------
# 4. Environment file
# ------------------------------------------------------------------------------
ENV_FILE=".env"

if [[ "$UPDATE" == "true" ]]; then
  say "Pulling latest code…"
  git pull --ff-only 2>/dev/null || warn "git pull failed (not a git repo?) — continuing with current files"
fi

if [[ -f "$ENV_FILE" ]]; then
  ok "Existing .env found — keeping your settings"
  # Refresh APP_PORT if the user passed a different one
  if [[ "$PORT" != "3000" ]]; then
    sed -i.bak "s/^APP_PORT=.*/APP_PORT=${PORT}/" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
  fi
  # Refresh domain-related settings when a --domain / --email is given
  if [[ -n "$DOMAIN" ]]; then
    sed -i.bak "s|^APP_URL=.*|APP_URL=https://${DOMAIN}|" "$ENV_FILE"
    sed -i.bak "s/^CADDY_DOMAIN=.*/CADDY_DOMAIN=${DOMAIN}/" "$ENV_FILE" 2>/dev/null || true
    grep -q '^CADDY_DOMAIN=' "$ENV_FILE" || echo "CADDY_DOMAIN=${DOMAIN}" >> "$ENV_FILE"
    rm -f "${ENV_FILE}.bak"
    ok "Domain set to ${DOMAIN} (automatic HTTPS via Caddy)"
  fi
  if [[ -n "$ACME_EMAIL" ]]; then
    sed -i.bak "s/^ACME_EMAIL=.*/ACME_EMAIL=${ACME_EMAIL}/" "$ENV_FILE" 2>/dev/null || true
    grep -q '^ACME_EMAIL=' "$ENV_FILE" || echo "ACME_EMAIL=${ACME_EMAIL}" >> "$ENV_FILE"
    rm -f "${ENV_FILE}.bak"
    ok "Let's Encrypt account email set to ${ACME_EMAIL}"
  fi
else
  say "Creating ${ENV_FILE}…"
  AUTH_SECRET="$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  if [[ -n "$DOMAIN" ]]; then
    APP_URL="https://${DOMAIN}"
    CADDY_DOMAIN="${DOMAIN}"
  else
    # No domain yet — Caddy serves plain HTTP on port 80 for any host
    APP_URL="http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo localhost)"
    CADDY_DOMAIN=""
  fi
  if [[ -n "$RESEND_KEY" ]]; then EMAIL_FROM="FindLink <noreply@${DOMAIN:-findlink.site}>"; else EMAIL_FROM="FindLink <onboarding@resend.dev>"; fi

  cat > "$ENV_FILE" <<EOF
# Generated by install.sh on $(date '+%Y-%m-%d %H:%M:%S')
AUTH_SECRET=${AUTH_SECRET}
APP_URL=${APP_URL}
# Domain for the built-in Caddy proxy — empty = plain HTTP on port 80
CADDY_DOMAIN=${CADDY_DOMAIN}
ACME_EMAIL=${ACME_EMAIL}
APP_PORT=${PORT}
RESEND_API_KEY=${RESEND_KEY}
EMAIL_FROM=${EMAIL_FROM}
EOF
  ok "Generated AUTH_SECRET (${AUTH_SECRET:0:8}…)"
fi

# ------------------------------------------------------------------------------
# 4b. Choose the app image: prebuilt (GHCR) or local build
#     A 512 MB VPS often cannot survive `next build` (needs 1–2 GB RAM).
#     GitHub Actions builds the image on every push (.github/workflows/
#     build.yml) — the VPS then only PULLS it. Local build stays the fallback.
# ------------------------------------------------------------------------------
IMAGE=""

if [[ -n "$IMAGE_ARG" ]]; then
  IMAGE="${IMAGE_ARG}"
  ok "Using prebuilt image (from --image): ${IMAGE}"
else
  # Auto-detect from the git remote: https://github.com/OWNER/REPO(.git)
  REMOTE="$(git remote get-url origin 2>/dev/null || true)"
  if [[ "$REMOTE" =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
    CANDIDATE="ghcr.io/${BASH_REMATCH[1],,}/${BASH_REMATCH[2],,}:latest"
    if docker manifest inspect "$CANDIDATE" >/dev/null 2>&1; then
      IMAGE="$CANDIDATE"
      ok "Prebuilt image detected: ${IMAGE}"
    else
      say "No prebuilt image found at ${CANDIDATE}"
      say "  (private repo? needs 'docker login ghcr.io' — or the GitHub Actions"
      say "   build may still be running: repo → Actions tab → “Build Docker image”)"
      if [[ "$UPDATE" != "true" ]] && ! confirm "Continue with a LOCAL build instead? (slow on 512 MB VPS)"; then
        die "Re-run later: ./install.sh --image ${CANDIDATE}"
      fi
    fi
  fi
fi

# Record the choice in .env (compose reads IMAGE from there)
if [[ -n "$IMAGE" ]]; then
  sed -i.bak "s|^IMAGE=.*|IMAGE=${IMAGE}|" "$ENV_FILE" 2>/dev/null || true
  grep -q '^IMAGE=' "$ENV_FILE" || echo "IMAGE=${IMAGE}" >> "$ENV_FILE"
  rm -f "${ENV_FILE}.bak"
else
  # local build mode — clear any stale IMAGE line
  sed -i.bak "/^IMAGE=/d" "$ENV_FILE" 2>/dev/null || true
  rm -f "${ENV_FILE}.bak"
fi

# ------------------------------------------------------------------------------
# 5. Start (pull prebuilt image, or build locally)
# ------------------------------------------------------------------------------
if [[ -n "$IMAGE" ]]; then
  say "Pulling prebuilt image: ${IMAGE}"
  say "This also starts the Caddy HTTPS proxy (findlink-caddy container)."
  if ! docker compose pull findlink; then
    die "Could not pull ${IMAGE}.
     Private image? Run:  docker login ghcr.io -u YOUR_USERNAME
     (password = GitHub token with read:packages scope)"
  fi
  docker compose up -d --no-build
else
  say "Building the Docker image locally (10–30 min on a 512 MB VPS — it uses"
  say "swap; 'stuck' output during 'npm run build' is normal, let it finish)."
  say "This also starts the Caddy HTTPS proxy (findlink-caddy container)."
  docker compose up -d --build
fi

ok "Containers started"

# ------------------------------------------------------------------------------
# 6. Health check
# ------------------------------------------------------------------------------
say "Waiting for the app to become healthy…"
healthy=false
for i in $(seq 1 40); do
  status="$(docker inspect --format '{{.State.Health.Status}}' findlink 2>/dev/null || echo unknown)"
  if [[ "$status" == "healthy" ]]; then healthy=true; break; fi
  sleep 3
done

echo ""
if [[ "$healthy" == "true" ]]; then
  ok "FindLink is up and healthy!"
else
  warn "Health check still pending — the first boot syncs the database."
  warn "Check status with:  docker logs -f findlink"
fi

APP_URL_F="$(grep '^APP_URL=' "$ENV_FILE" | cut -d= -f2-)"
CADDY_DOMAIN_F="$(grep '^CADDY_DOMAIN=' "$ENV_FILE" | cut -d= -f2-)"
IMAGE_F="$(grep '^IMAGE=' "$ENV_FILE" | cut -d= -f2-)"
echo ""
echo -e "${BOLD}──────────────────────────────────────────────────────────${RESET}"
echo -e " ${GREEN}FindLink is running${RESET}"
echo -e ""
echo -e "  URL           : ${BOLD}${APP_URL_F}${RESET}"
if [[ -n "$IMAGE_F" ]]; then
  echo -e "  Image         : ${DIM}${IMAGE_F} (prebuilt — VPS never builds)${RESET}"
else
  echo -e "  Image         : ${DIM}built locally from the Dockerfile${RESET}"
fi
if [[ -n "$CADDY_DOMAIN_F" ]]; then
  echo -e "  HTTPS         : ${DIM}automatic — certificate is issued as soon as DNS points${RESET}"
  echo -e "                  ${DIM}at this VPS (check: docker logs -f findlink-caddy)${RESET}"
else
  echo -e "  HTTPS         : ${DIM}off (no domain set) — serving HTTP on port 80${RESET}"
fi
echo -e "  Admin signup  : ${DIM}the FIRST account you register becomes ADMIN${RESET}"
echo -e "  Emails        : ${DIM}set RESEND_API_KEY in .env to enable verification mails${RESET}"
echo -e ""
echo -e "  Useful commands:"
echo -e "   ${CYAN}docker logs -f findlink${RESET}            # follow app logs"
echo -e "   ${CYAN}docker logs -f findlink-caddy${RESET}        # follow HTTPS proxy / certs"
echo -e "   ${CYAN}docker compose restart${RESET}            # restart"
echo -e "   ${CYAN}./install.sh --update${RESET}              # update to latest version"
echo -e "   ${CYAN}docker compose down${RESET}                # stop"
echo -e ""
if [[ -z "$IMAGE_F" ]]; then
  echo -e " ${YELLOW}Tip (512 MB VPS):${RESET} avoid local builds entirely — push to GitHub and"
  echo -e " deploy the prebuilt image: ${CYAN}./install.sh --image ghcr.io/YOU/findlink:latest${RESET}"
  echo -e ""
fi
if [[ -z "${RESEND_KEY}" && ! -f .env.resend ]]; then
  echo -e " ${YELLOW}Next step:${RESET} add your Resend API key to ${BOLD}.env${RESET} then run"
  echo -e " ${CYAN}docker compose up -d${RESET} — email verification will then work."
fi
if [[ -n "$CADDY_DOMAIN_F" ]]; then
  echo -e " ${YELLOW}Domain:${RESET} point an ${BOLD}A record${RESET} for ${CADDY_DOMAIN_F} at this VPS —"
  echo -e " HTTPS goes live automatically (nothing else to configure)."
else
  echo -e " ${YELLOW}Domain later:${RESET} run ${CYAN}./install.sh --domain your.domain${RESET} to switch on"
  echo -e " automatic HTTPS (needs an A record pointing at this VPS)."
fi
echo -e " ${DIM}Public traffic → Caddy (ports 80/443). The app itself answers only on"
echo -e " 127.0.0.1:${PORT} for local debugging (APP_BIND in .env).${RESET}"
echo -e "${BOLD}──────────────────────────────────────────────────────────${RESET}"
echo ""
