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
| **Auth & security** | JWT sessions (httpOnly cookies), bcrypt passwords, zod validation, rate limiting, open-redirect protection, hashed IPs |
| **Admin panel** | Platform stats, moderate listings (feature / hide / delete), recent users |
| **Beautiful UI** | Dark/light themes, fully responsive, animated, accessible |
| **Self-hosted** | SQLite (no separate DB server), Docker, ~180 MB image, one-command install |

The **first account you register automatically becomes the ADMIN**.

---

## 📦 What you need before starting

- A **VPS** with 512 MB+ RAM (Ubuntu 22.04/24.04 or Debian 12 recommended), root or sudo access
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

### 🟢 Step 3 — Deploy with one command (~5–15 min)

Still inside your VPS, clone your repo and run the installer:

```bash
git clone https://github.com/YOUR_USERNAME/findlink.git
cd findlink
./install.sh --domain findlink.site
```

The installer automatically:

1. ✅ checks Docker (and installs it if missing),
2. ✅ creates a 1 GB **swap file** if your VPS has none (needed for the build on 512 MB),
3. ✅ generates a secure `AUTH_SECRET` and writes your `.env` with
   `APP_URL=https://findlink.site`,
4. ✅ builds and starts the container,
5. ✅ waits for the health check to pass.

When you see **“FindLink is up and healthy!”**, open `http://YOUR_VPS_IP:3000`
in your browser — your site is already live! 🎉

<details>
<summary>Prefer doing it manually? (same result, 4 commands)</summary>

```bash
git clone https://github.com/YOUR_USERNAME/findlink.git && cd findlink

cp .env.example .env
nano .env          # set AUTH_SECRET (openssl rand -hex 32) and APP_URL=https://findlink.site

docker compose up -d --build
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

### 🟢 Step 5 — Enable HTTPS (choose one, ~3 min)

Pick **one** of the two options below. Option A also unlocks **country tracking**
for your short links.

#### Option A — Cloudflare (recommended: free SSL + geo-tracking)

1. Create a free account at [cloudflare.com](https://cloudflare.com) and
   **Add a site** → `findlink.site` (Free plan).
2. Cloudflare scans your DNS — keep the `A` record for `@` pointing at your VPS
   (fix it if needed), then **Continue**.
3. Change the **nameservers** of findlink.site at your registrar to the two
   Cloudflare nameservers it shows you.
4. In Cloudflare → **SSL/TLS** → set mode to **Full (strict)**.
5. In Cloudflare → **Network** → turn **IP Geolocation ON**.
   FindLink will automatically read the `CF-IPCountry` header and fill the
   **country breakdown** in short-link analytics.
6. Make sure the DNS record for `@` has the **orange cloud** (proxied) enabled.

#### Option B — Caddy on the VPS (automatic HTTPS, ~20 MB RAM)

```bash
apt install -y caddy
printf 'findlink.site {\n    reverse_proxy 127.0.0.1:3000\n}\n' > /etc/caddy/Caddyfile
caddy reload --config /etc/caddy/Caddyfile
```

Caddy obtains and renews a free Let's Encrypt certificate for findlink.site
automatically. Ports 80 + 443 must be reachable from the internet.

---

### 🟢 Step 6 — Create your admin account (~1 min)

1. Open **https://findlink.site** (or `http://YOUR_VPS_IP:3000` if you skipped Step 5).
2. Click **Create account** and register.
3. The **first account registered becomes the ADMIN** — that's you.
4. Verify your email:
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

## 🔁 Day-to-day operations

```bash
cd ~/findlink                     # the repo lives here on your VPS

docker logs -f findlink           # follow live logs
docker compose restart            # restart the app
docker compose down               # stop the app
./install.sh --update             # pull latest code from GitHub + rebuild + restart
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
| `APP_PORT` | — | Host port (default `3000`) |
| `RESEND_API_KEY` | — | Resend API key. Without it, verification links are logged and shown in the UI (dev mode) |
| `EMAIL_FROM` | — | `FindLink <noreply@findlink.site>` (requires a Resend-verified domain) |

After editing `.env`, always run `docker compose up -d` to apply.

---

## 🧰 Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails with `Killed` (OOM) | The 512 MB VPS ran out of memory during the Docker build. The installer normally creates swap — check with `free -h`. If there's no swap: `fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`, then `docker compose up -d --build` again |
| Prisma error about libssl/openssl | Build the provided `Dockerfile` unmodified (it already installs `openssl`) |
| Emails not arriving | Check `RESEND_API_KEY`, a **verified findlink.site domain** in Resend, and `docker logs findlink` |
| Country column shows “Unknown” | Enable **Cloudflare IP Geolocation** (Step 5, Option A) or front the app with a proxy that sets a country header |
| Forgot admin access | The first registered user is admin. If you lost it: `docker compose down`, rename the volume (`docker volume rm findlink-data` — ⚠️ deletes all data) and start fresh |
| Health check pending | First boot syncs the database — give it ~30 s, watch `docker logs -f findlink` |
| “Port is already allocated” | Another app uses port 3000 — set a different `APP_PORT` in `.env` and `docker compose up -d` |
| Domain doesn't resolve | `ping findlink.site` — if it doesn't show your VPS IP, the A record from Step 4 isn't applied yet |

---

## 🧱 Architecture

```
┌─────────────────────────────── Docker container (~180 MB) ─────────────────────────────┐
│  FindLink — Next.js 16 (standalone build)                                              │
│  ├─ UI: React 19 · Tailwind CSS 4 · shadcn/ui · Recharts                               │
│  ├─ API routes: auth, links, shortlinks, stats, admin, health                          │
│  ├─ Redirect engines: /s/:code (short links) · /go/:slug (directory click-through)     │
│  ├─ SQLite via Prisma (file on a Docker volume — no separate DB process)               │
│  └─ Click tracking: UA parsing, referrer domain, country via CDN headers, hashed IPs   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Why this stack fits a 512 MB VPS**

- SQLite runs **in-process** — no PostgreSQL/MySQL server eating 100–300 MB.
- Next.js **standalone** output ships only traced dependencies.
- In-memory sliding-window rate limiting — no Redis.
- GeoIP via CDN request headers (Cloudflare) — no multi-megabyte GeoIP database.
- Swap file (created by the installer) carries the Docker build through its memory peak.
- Container memory capped at 460 MB with log rotation — the kernel always keeps breathing room.

---

## 🔒 Security notes

- Passwords: bcrypt (10 rounds). Sessions: signed JWT in `httpOnly`, `sameSite=lax` cookies.
- Short-link destinations are validated to `http`/`https` only — blocks `javascript:` and other scheme abuse.
- Visitor IPs are **never stored raw** — a salted SHA-256 hash is kept for unique-visitor counts only.
- Rate limits: login 10/10 min, registration 5/h, submissions 10/day, shortening 30/h per user, 60 clicks/min per IP per link.
- Admin actions are authorized server-side on every request.

---

## 📄 License

MIT — see [LICENSE](LICENSE). Do whatever you like, attribution appreciated.

---

<div align="center">

**FindLink** · findlink.site · Built for communities.

</div>
