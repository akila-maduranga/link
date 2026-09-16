<div align="center">

# 🔎 FindLink

**Find, share and track the best communities on the internet.**

A beautiful, feature-packed link directory + URL shortener for Telegram channels,
WhatsApp groups, Facebook pages and more — designed to run comfortably on a
**512 MB RAM VPS**, deployed with **one command** via Docker.

`findlink.site` · discover → share → shorten → track

</div>

---

## ✨ What you get

| Area | Details |
|------|---------|
| **Link directory** | Submit social communities with title, URL, description, member count |
| **15 platforms** | Telegram, WhatsApp, Facebook, YouTube, Discord, X, Instagram, Reddit, TikTok, LinkedIn, Snapchat, Twitch, Pinterest, Signal + Other |
| **Smart filtering** | Category (25), Country (130+ with flags), Language (27), platform pills, full-text search, sort by newest / most clicked / featured |
| **URL shortener** | Logged-in users shorten any URL with optional **custom aliases** (`findlink.site/s/my-link`) |
| **Detailed tracking** | Every click records country, browser, OS, device, referrer, bot status and unique visitor (salted IP hash) |
| **Analytics dashboard** | Interactive charts: clicks over time, top countries, browsers, OS, devices, referrers, visitor quality |
| **Email verification** | Transactional emails via [Resend](https://resend.com) with branded templates |
| **Automatic HTTPS** | Built-in Caddy reverse proxy — free Let's Encrypt certificate for findlink.site, issued & renewed with zero configuration |
| **Auth & security** | JWT sessions (httpOnly cookies), bcrypt passwords, zod validation, rate limiting, open-redirect protection, hashed IPs |
| **Admin panel** | Platform stats, moderate listings (feature / hide / delete), recent users |
| **Beautiful UI** | Dark/light themes, fully responsive, animated, accessible |
| **Self-hosted** | SQLite (no separate DB server), Docker, ~420 MB image, one-command install |

The **first account you register automatically becomes the ADMIN**.

---

## 📦 What you need before starting

- A **VPS** with 512 MB+ RAM (Ubuntu 22.04/24.04 or Debian 12 recommended), root or sudo access, with **ports 80 + 443** reachable (for automatic HTTPS)
- Your domain **findlink.site** (point it to your VPS in Step 4)
- A **GitHub** account (free) — the code is deployed from your own repo
- 10 minutes of time
- *(Optional)* a free [Resend](https://resend.com) account for verification emails

> Don't have email set up yet? No problem — the app works without it
> (verification links are shown on screen and logged), and you can add
> Resend any time in [Step 7](#-step-7--optional-enable-verification-emails-resend).

---

## 🚀 Step-by-step setup

### 🟢 Step 1 — Put the code on GitHub (once, ~3 min)

1. Unzip the project and open a terminal in it:

   ```bash
   unzip findlink.zip && cd findlink
   ```

2. Make it a git repository and commit everything:

   ```bash
   git init
   git add .
   git commit -m "FindLink initial deploy"
   git branch -M main
   ```

3. On [github.com/new](https://github.com/new) create a new repository — name it
   **`findlink`**, keep it **Public** or **Private** (both work), and **do not**
   add a README/license (the repo already has them).

4. Push it (replace `YOUR_USERNAME` with your GitHub username):

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/findlink.git
   git push -u origin main
   ```

> 💡 If GitHub asks for a password when pushing, it needs a
> [Personal Access Token](https://github.com/settings/tokens) (classic, with
> `repo` scope) instead of your login password.

---

### 🟢 Step 2 — Prepare your VPS (~2 min)

SSH into your VPS:

```bash
ssh root@YOUR_VPS_IP
```

Install Docker (if it's not already there):

```bash
curl -fsSL https://get.docker.com | sh
```

That's it — the deploy script in the next step handles everything else,
including swap for the 512 MB build step.

---

### 🟢 Step 3 — Deploy with one command (~5 min)

Still inside your VPS, clone your repo and run the installer:

```bash
git clone https://github.com/YOUR_USERNAME/findlink.git
cd findlink
./install.sh --domain findlink.site
```

The installer automatically:

1. ✅ checks Docker (and installs it if missing),
2. ✅ creates ~2 GB **swap** if your VPS has little (needed for local builds on 512 MB),
3. ✅ generates a secure `AUTH_SECRET` and writes your `.env` with
   `APP_URL=https://findlink.site`,
4. ✅ **pulls the prebuilt image from GitHub** (see below) — or builds locally,
5. ✅ waits for the health check to pass.

When you see **“FindLink is up and healthy!”**, two containers are running:
`findlink` (the app) and `findlink-caddy` (the HTTPS proxy). As soon as your
DNS points at the VPS ([Step 4](#-step-4--connect-your-domain-findlinksite-2-min)),
**https://findlink.site goes live with a real certificate — nothing else to
configure.** 🎉

> 🧪 Before DNS is ready you can sanity-check on the VPS itself:
> `curl http://127.0.0.1:3000/api/health` → `{"ok":true…}`

<details>
<summary>⭐ 512 MB VPS — let GitHub build the image for you (recommended)</summary>

`next build` alone wants 1–2 GB of RAM; on a 512 MB VPS the local build
**thrashes swap and looks stuck for 30+ minutes or gets OOM-killed**.

The repo ships with a GitHub Actions workflow (`.github/workflows/build.yml`)
that builds the Docker image on **every push to `main`** and publishes it to
`ghcr.io`. Your VPS then only **pulls** the finished image — no build, ~180 MB
download, works on any tiny VPS:

1. Push your code to GitHub (Step 1) and wait ~5 min for the
   **Actions → “Build Docker image”** workflow to finish (green ✓).
2. On the VPS:

   ```bash
   ./install.sh --image ghcr.io/YOUR_USERNAME/findlink:latest
   ```

   (Plain `./install.sh` auto-detects the image for public repos, too — and
   remembers the choice in `.env`, so `./install.sh --update` keeps pulling
   it. `./install.sh --build` switches back to local builds, and
   `./install.sh --help` shows all options.)

**Private repo?** The image is private as well — log in once on the VPS:

```bash
docker login ghcr.io -u YOUR_USERNAME
# password = a GitHub Personal Access Token with `read:packages` scope
```

</details>

<details>
<summary>Prefer doing it manually? (same result, 4 commands)</summary>

```bash
git clone https://github.com/YOUR_USERNAME/findlink.git && cd findlink

cp .env.example .env
nano .env          # set AUTH_SECRET (openssl rand -hex 32); CADDY_DOMAIN=findlink.site is already there

docker compose up -d --build      # or: docker compose pull findlink && docker compose up -d --no-build
docker logs -f findlink
```

</details>

---

### 🟢 Step 4 — Connect your domain `findlink.site` (~2 min)

In your domain registrar's DNS settings (where you bought findlink.site):

| Type  | Name              | Value        | TTL  |
|-------|-------------------|--------------|------|
| `A`   | `@` (root)        | `YOUR_VPS_IP` | Auto |
| `CNAME` | `www`           | `findlink.site` | Auto |

Wait a minute or two for DNS to propagate (check with `ping findlink.site` —
it should answer with your VPS IP).

---

### 🟢 Step 5 — HTTPS: already on (nothing to do) ✨

Your deployment includes a **Caddy reverse proxy** (the `findlink-caddy`
container) that took care of everything the moment DNS pointed at your VPS:

- ✅ free **Let's Encrypt certificate** for findlink.site — issued
  automatically, renewed automatically (watch it happen:
  `docker logs -f findlink-caddy`)
- ✅ **HTTP → HTTPS redirect** on port 80
- ✅ **HTTP/3**, gzip/zstd compression and security headers
- ✅ the app container itself stays private (localhost-only) — all public
  traffic goes through the proxy

Open **https://findlink.site** — that's it.

> Ports **80 and 443** must be reachable from the internet (on most VPS
> providers they are by default; open them in your cloud firewall if you
> have one).

<details>
<summary>🌐 Optional — put Cloudflare in front (free CDN + country tracking)</summary>

Cloudflare is **not required** — but it adds a free CDN and enables the
**country breakdown** in your short-link analytics (via the `CF-IPCountry`
header, which passes through Caddy untouched):

1. Create a free account at [cloudflare.com](https://cloudflare.com) and
   **Add a site** → `findlink.site` (Free plan).
2. Keep the `A` record for `@` pointing at your VPS, then **Continue**.
3. Change the **nameservers** of findlink.site at your registrar to the two
   Cloudflare nameservers it shows you.
4. In Cloudflare → **SSL/TLS** → set mode to **Full (strict)**.
5. In Cloudflare → **Network** → turn **IP Geolocation ON**.
6. Make sure the DNS record for `@` has the **orange cloud** (proxied) enabled.

Certificate issuance keeps working through Cloudflare's proxy, and visitor
IPs still reach the app correctly via `CF-Connecting-IP`.

</details>

---

### 🟢 Step 6 — Create your admin account (~1 min)

1. Open **https://findlink.site** — the certificate was issued automatically
   (if the browser still complains, give DNS a minute and reload; check
   `docker logs findlink-caddy`).
2. Click **Create account** and register with a **Gmail or iCloud email
   address** (that's the signup policy — see `ALLOWED_EMAIL_DOMAINS` in
   `.env` if you ever want to change it).
3. The **first account registered becomes the ADMIN** — that's you.
4. **Admin dashboard:** sign in, then click your avatar → **Admin**
   (or go straight to `https://findlink.site/admin`) — platform stats,
   moderate listings (feature / hide / delete) and recent users.
5. Verify your email:
   - With Resend configured (Step 7) — click the link in the email you receive.
   - Without Resend — the verification link is shown directly on screen
     (and in `docker logs findlink`); just click it.

Once verified you can submit links to the directory, shorten URLs and see
live analytics. You'll also find the **Admin** area in your dashboard menu to
feature or hide listings.

---

### 🟢 Step 7 — (Optional) Enable verification emails — Resend (~5 min)

Emails are optional but recommended for a public directory — they keep
submissions trustworthy.

1. Create a free account at [resend.com](https://resend.com)
   (**100 emails/day free** — plenty for this).
2. In the Resend dashboard: **Domains → Add Domain** → enter `findlink.site`.
3. Resend shows you DNS records (SPF / DKIM / DMARC). Add them in your DNS
   panel (Cloudflare or registrar), then wait for Resend to show **Verified**.
4. Copy your API key (`re_…`) from **API Keys**, then on the VPS:

   ```bash
   cd ~/findlink
   nano .env
   ```

   Set these two lines:

   ```env
   RESEND_API_KEY=re_your_key_here
   EMAIL_FROM=FindLink <noreply@findlink.site>
   ```

5. Apply the change:

   ```bash
   docker compose up -d
   ```

Done — new users now receive real verification and password-reset emails.

> 🧪 **Testing before your domain is verified?** You can temporarily use
> `EMAIL_FROM=FindLink <onboarding@resend.dev>` — Resend allows sending to
> your own account email only in that mode.

---

## 💳 Premium — selling $3/month upgrades (PayPal)

FindLink has a built-in **Premium** plan: free accounts can create **2 short
links with click analytics** (plus unlimited untracked links and unlimited
free community submissions); **Premium ($3 / 30 days)** unlocks unlimited
tracked links. Payments run through **PayPal Checkout** — no card data ever
touches your server.

### Turning it on (~5 min, no image rebuild)

1. Go to **https://developer.paypal.com** → *Apps & Credentials* → **Live** tab
   (or **Sandbox** to test first) → *Create App* → copy the **Client ID** and
   **Secret** of your REST API app.
2. Add them to `.env` on the VPS:
   ```bash
   cd ~/findlink
   nano .env
   # …
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_secret
   PAYPAL_MODE=live            # sandbox = test mode
   # ADMIN_EMAIL=you@example.com   # optional: who gets payment emails
   docker compose up -d        # restart — done, premium page is live
   ```
   (or use the installer flags:
   `./install.sh --paypal-client-id … --paypal-secret … --paypal-mode live`)
3. Admin abilities: **Admin panel → Users & premium** — search any user,
   *Make premium / Extend +30d / Revoke*; **Premium payments** section (plus
   `GET /api/admin/payments`) lists every payment with buyer, amount, PayPal
   order id and payer email. Every completed payment also emails the admin
   (`ADMIN_EMAIL`, or every admin account by default) and receipts the buyer.

### How the money flows (secure end-to-end)

1. Your server **creates** the PayPal order with the amount fixed **server-side**
   ($3.00 USD) and a `custom_id` binding the order to the paying user.
2. The buyer approves on **PayPal's own popup/domain** — card data never
   transits your server (PCI SAQ-A scope).
3. Your server **captures** the order server-to-server and **verifies**:
   order + capture status `COMPLETED`, exact amount + currency, and `custom_id`
   matching the signed-in session. Any mismatch → no premium credited.
4. A unique `orderId` row in the `Payment` table makes crediting exactly-once
   (safe against double-clicks, retries and replays); renewals stack 30 days
   onto the current expiry.

Until credentials are set, the `/premium` page simply shows a
"payments coming soon" card — nothing else changes.

> 💡 **Testing:** set sandbox credentials + `PAYPAL_MODE=sandbox`, then pay
> with the sandbox **personal** account (email + password visible under
> *developer.paypal.com → Testing tools → Sandbox accounts*). Switch to
> `live` + live credentials when done.

---

## 🔁 Day-to-day operations

```bash
cd ~/findlink                     # the repo lives here on your VPS

docker logs -f findlink           # follow live app logs
docker logs -f findlink-caddy     # follow the HTTPS proxy / certificates
docker compose restart            # restart
docker compose down               # stop
./install.sh --update             # pull latest code + image (prebuilt mode) + restart
./install.sh --help               # show all installer options
```

### Backup & restore the database

```bash
# Backup (creates a dated .tar.gz in the repo folder)
docker run --rm -v findlink-data:/db -v $(pwd):/out alpine \
  tar czf /out/findlink-backup-$(date +%F).tar.gz -C /db .

# Restore
docker compose down
docker run --rm -v findlink-data:/db -v $(pwd):/out alpine \
  sh -c "cd /db && tar xzf /out/findlink-backup-YYYY-MM-DD.tar.gz"
docker compose up -d
```

---

## ⚙️ Environment variables (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | ✅ | Long random string — signs sessions & salts IP hashes. `openssl rand -hex 32` |
| `APP_URL` | ✅ | Public URL used in emails & short links — `https://findlink.site` |
| `CADDY_DOMAIN` | — | Domain for the built-in Caddy proxy — `findlink.site` → automatic Let's Encrypt HTTPS. Empty → plain HTTP on port 80 |
| `ACME_EMAIL` | — | Optional email for Let's Encrypt expiry notices (also settable via `./install.sh --email …`) |
| `APP_PORT` | — | Host port for **localhost-only** debug access (default `3000`); public traffic goes through Caddy on 80/443 |
| `APP_BIND` | — | Default `127.0.0.1` (app private behind Caddy). `0.0.0.0` exposes it directly — not recommended |
| `IMAGE` | — | Prebuilt app image — set automatically by `install.sh --image …` and remembered across updates. Empty → build locally from the Dockerfile (`./install.sh --build` resets it). Recommended for 512 MB VPSes |
| `RESEND_API_KEY` | — | Resend API key. Without it, verification links are logged and shown in the UI (dev mode) |
| `EMAIL_FROM` | — | `FindLink <noreply@findlink.site>` (requires a Resend-verified domain) |
| `ALLOWED_EMAIL_DOMAINS` | — | New registrations limited to these email domains — default **Gmail + iCloud** (`gmail.com,googlemail.com,icloud.com,me.com,mac.com`). Set `*` to allow any |
| `NEXT_PUBLIC_GA_ID` | — | Google Analytics 4 measurement ID (gtag.js) — baked in at **build** time (GitHub Actions / `--build`), not read at runtime. Unset → `G-R6LJCEJD24` |
| `PAYPAL_CLIENT_ID` | — | PayPal REST app **client id** (public) — enables the premium checkout when set together with the secret. Read at **runtime**: add to `.env` + `docker compose up -d`, no rebuild |
| `PAYPAL_CLIENT_SECRET` | — | PayPal REST app **secret** — server-only, never sent to the browser |
| `PAYPAL_MODE` | — | `sandbox` (default — test payments) or `live` (real money) |
| `ADMIN_EMAIL` | — | Comma-separated recipients for payment-notification emails. Empty → every admin account |
| `PREMIUM_PRICE_USD` | — | Premium price per period — default `3.00` (server-enforced on every order) |
| `PREMIUM_DAYS` | — | Days of premium granted per payment — default `30` |

After editing `.env`, always run `docker compose up -d` to apply.

---

## 🧰 Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build gets stuck / `Killed` at `npm run build` | This is the 512 MB RAM limit — `next build` wants 1–2 GB. **Best fix:** deploy the prebuilt image instead (Step 3 → “let GitHub build the image for you”): `./install.sh --image ghcr.io/YOU/findlink:latest`. If you must build locally: make sure ~2 GB swap exists (`free -h`), and let it run — output appearing frozen during the compile step is normal on tiny VPSes. The build now aborts with a clear error (instead of hanging forever) if Turbopack exceeds its memory guardrail |
| Build fails with `Killed` (OOM) | The 512 MB VPS ran out of memory during the Docker build. The installer normally creates ~2 GB swap — check with `free -h`. If there's no swap: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`, then `docker compose up -d --build` again |
| `port is already allocated` (80/443) | A system web server is running — stop it, the stack brings its own proxy: `systemctl disable --now caddy nginx apache2` then `docker compose up -d` |
| `port is already allocated` (3000) | Another app uses port 3000 — set a different `APP_PORT` in `.env` and `docker compose up -d` |
| https://findlink.site doesn't load | 1) DNS: `ping findlink.site` must answer with your VPS IP. 2) Ports 80 + 443 open in any cloud firewall. 3) `docker logs findlink-caddy` shows certificate issuance. Wait a minute and reload |
| Prisma error about libssl/openssl | Build the provided `Dockerfile` unmodified (it already installs `openssl`) |
| App keeps restarting: `Cannot find module '@prisma/…'` (`@prisma/debug`, `@prisma/config`, …) | Your image predates the fixed Dockerfile — its runtime stage shipped an incomplete Prisma CLI closure (prisma 6.19 eagerly requires `@prisma/config` + its dependency tree at startup). Fix: update the repo files (`Dockerfile`, `.dockerignore`, `scripts/prisma-closure.cjs` — re-uploading the zip's `findlink/` folder over your clone is easiest), `git push`, wait for the **Actions** build to go green, then `./install.sh --update` |
| Emails not arriving | Check `RESEND_API_KEY`, a **verified findlink.site domain** in Resend, and `docker logs findlink` |
| Country column shows “Unknown” | Enable **Cloudflare IP Geolocation** (Step 5, optional Cloudflare section) or front the app with a proxy that sets a country header |
| Forgot admin access | The first registered user is admin. If you lost it: `docker compose down`, rename the volume (`docker volume rm findlink-data` — ⚠️ deletes all data) and start fresh |
| Health check pending | First boot syncs the database — give it ~30 s, watch `docker logs -f findlink` |
| Domain doesn't resolve | `ping findlink.site` — if it doesn't show your VPS IP, the A record from Step 4 isn't applied yet |

---

## 🧱 Architecture

```
┌────────────────── Docker Compose stack (fits in 512 MB RAM) ────────────────┐
│                                                                              │
│  ┌─ findlink-caddy ─────────────────────────────────────────────────────┐   │
│  │  Caddy reverse proxy — ports 80/443, automatic Let's Encrypt TLS,    │   │
│  │  HTTP→HTTPS redirect, HTTP/3, compression, security headers (~20 MB) │   │
│  └───────────────────────────┬──────────────────────────────────────────┘   │
│                              │ internal network                             │
│  ┌─ findlink (app) ──────────▼──────────────────────────────────────────┐   │
│  │  Next.js 16 standalone + complete Prisma CLI closure (~420 MB image)  │   │
│  │  ├─ UI: React 19 · Tailwind CSS 4 · shadcn/ui · Recharts              │   │
│  │  ├─ API routes: auth, links, shortlinks, stats, admin, health        │   │
│  │  ├─ Redirect engines: /s/:code (short) · /go/:slug (directory)       │   │
│  │  └─ SQLite via Prisma (file on a volume — no separate DB process)    │   │
│  └─ localhost:3000 only — never exposed to the internet directly ───────┘   │
│                                                                              │
│  Volumes: findlink-data (SQLite) · caddy-data (TLS certificates)            │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Why this stack fits a 512 MB VPS**

- SQLite runs **in-process** — no PostgreSQL/MySQL server eating 100–300 MB.
- Next.js **standalone** output ships only traced dependencies.
- The runtime image carries the Prisma CLI's complete dependency closure (~75 MB, 33 packages — `@prisma/config`'s `effect`/`c12` chain included — computed automatically by `scripts/prisma-closure.cjs`, with fail-loud guards; no package may be excluded, prisma 6.19 requires them eagerly) so every boot self-syncs the SQLite schema — no manual migrations, no extra DB tooling.
- In-memory sliding-window rate limiting — no Redis.
- GeoIP via CDN request headers (Cloudflare) — no multi-megabyte GeoIP database.
- Swap file (created by the installer) carries the Docker build through its memory peak.
- Memory budget: app capped at 450 MB + Caddy at 60 MB, with log rotation — the kernel always keeps breathing room.
- Build optimized for low RAM: TypeScript checks skipped at build time, Turbopack runs in-process (one Node process, ~100 MB less peak), V8 heap capped, and a 1 GB Turbopack guardrail turns a would-be hang into a clear error. Or skip VPS builds entirely via the GitHub Actions image.

**Credits**

- Platform icons: [coloured-icons](https://github.com/dheereshag/coloured-icons) by Dheeresh Agarwal — MIT License (served from `public/icons/platforms/`).

---

## 🔒 Security notes

- Passwords: bcrypt (10 rounds). Sessions: signed JWT (HS256, secret ≥ 32 chars) in `httpOnly`, `sameSite=lax` cookies.
- Registrations restricted to **Gmail and iCloud** email domains (server-enforced + form hint); configurable via `ALLOWED_EMAIL_DOMAINS`.
- Short-link destinations are validated to `http`/`https` only — at submission **and again at redirect time** — blocking `javascript:` and other scheme abuse.
- Visitor IPs are **never stored raw** — a salted SHA-256 hash is kept for unique-visitor counts only.
- Rate limits: login 10/10 min per IP **and per account**, registration 5/h, submissions 10/day, shortening 30/h per user, 60 clicks/min per IP per link.
- Admin actions and all record mutations are authorized server-side on every request (ownership checks on every link/short link).
- **OWASP secure headers on every response** (`src/proxy.ts` + `next.config.ts`): per-request **nonce CSP** with `strict-dynamic` (Google Analytics is allow-listed and keeps working), `frame-ancestors 'none'` + `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, and **HSTS** over HTTPS.
- Login is **timing-safe** (a dummy bcrypt compare runs for unknown emails, so response times can't be used to enumerate accounts); password-reset responses never reveal whether an email exists.
- Request bodies are capped at 32 KB (`413` above that) — protects the 512 MB container from memory-exhaustion payloads.
- `npm audit` is reviewed each release: remaining advisories (as of this release) are confined to the Prisma CLI **boot-time** dependency chain (config loading during `prisma db push`) — never in the request-serving path.
- **Payments (PayPal Orders API v2):** amounts are fixed server-side (never accepted from the browser), captures are executed and verified server-to-server over HTTPS (status + capture status + amount + currency + `custom_id` user binding), crediting is idempotent via a unique `orderId` in the database, and all payment endpoints require a verified session and are rate-limited (6 order creates / 10 min, 12 captures / 10 min). Card data never touches this server — buyers authenticate on PayPal's domain. The PayPal SDK is allow-listed in the CSP (`frame-src`/`img-src`/`connect-src` for `*.paypal.com`, `*.paypalobjects.com`) while the nonce + `strict-dynamic` policy stays intact, and `Cross-Origin-Opener-Policy: same-origin-allow-popups` keeps the checkout popup handshake secure.

---

## 📄 License

MIT — see [LICENSE](LICENSE). Do whatever you like, attribution appreciated.

---

<div align="center">

**FindLink** · findlink.site · Built for communities.

</div>
