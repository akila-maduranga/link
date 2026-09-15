# syntax=docker/dockerfile:1

# ==============================================================================
# FindLink (findlink.site) — optimized for 512 MB VPS deployments
# Multi-stage build: deps → builder → minimal runtime (~350 MB final image,
# incl. the Node alpine base + a slim Prisma CLI for boot-time schema sync)
# ==============================================================================

# ---------- Stage 1: dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Prisma postinstall (prisma generate) needs the schema at install time
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Dummy URL — generate does not need a live database
ENV DATABASE_URL="file:/app/db/custom.db" \
    NEXT_TELEMETRY_DISABLED=1

RUN npm ci --no-audit --no-fund

# ---------- Stage 2: build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL="file:/app/db/custom.db" \
    AUTH_SECRET="build-time-placeholder-secret-value-0123456789" \
    NODE_OPTIONS="--max-old-space-size=512" \
    TURBOPACK_MEMORY_LIMIT=1024 \
    NEXT_TURBOPACK_USE_WORKER=0

# Generate the Prisma client (musl engine included via schema binaryTargets)
RUN npx prisma generate

# 512 MB VPS build profile:
#   NODE_OPTIONS              → caps the V8 heap; the JS side may gently use
#                               swap instead of blowing up the machine
#   TURBOPACK_MEMORY_LIMIT    → Turbopack aborts with a clear error past 1 GB
#                               instead of thrashing swap (looks like a hang)
#   NEXT_TURBOPACK_USE_WORKER → runs Turbopack in-process: one Node process
#                               instead of two (~100 MB less peak memory)
RUN npm run build

# Isolate the Prisma CLI + its full dependency closure for the runtime image.
# prisma 6 needs @prisma/debug, @prisma/get-platform, @prisma/engines-version
# and @prisma/fetch-engine as well — copying just prisma/ + @prisma/engines/
# ships an image that crash-loops with: Cannot find module '@prisma/debug'.
# The script also prunes query-engine dead weight (~100 MB) and fails loudly
# if a future prisma version needs a package this doesn't know about.
# @prisma/config is excluded: only loaded when a prisma.config.ts exists
# (not in this repo) — it would drag in effect + typescript (~50 MB).
RUN node scripts/prisma-closure.cjs --root /app/node_modules --out /prisma-cli \
        --exclude @prisma/config

# ---------- Stage 3: runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app

# openssl: required by Prisma engines on alpine (musl)
RUN apk add --no-cache openssl \
    && addgroup -S findlink && adduser -S findlink -G findlink

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL="file:/app/db/custom.db"

# Standalone Next.js server (traced minimal node_modules)
COPY --from=builder --chown=findlink:findlink /app/.next/standalone ./
COPY --from=builder --chown=findlink:findlink /app/.next/static ./.next/static
COPY --from=builder --chown=findlink:findlink /app/public ./public

# Prisma CLI + its full dependency closure (schema sync on boot), merged into
# the standalone node_modules (COPY merges into the existing directory).
# prisma/ + the schema are needed by docker-entrypoint.sh at every boot.
COPY --from=builder --chown=findlink:findlink /app/prisma ./prisma
COPY --from=builder --chown=findlink:findlink /prisma-cli/node_modules ./node_modules
RUN mkdir -p node_modules/.bin \
    && printf '#!/bin/sh\nexec node /app/node_modules/prisma/build/index.js "$@"\n' > node_modules/.bin/prisma \
    && chmod +x node_modules/.bin/prisma

# Entrypoint: sync DB schema, then start
COPY --chown=findlink:findlink docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh \
    && mkdir -p /app/db \
    && chown -R findlink:findlink /app

USER findlink

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
