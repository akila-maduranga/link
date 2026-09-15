# syntax=docker/dockerfile:1

# ==============================================================================
# FindLink (findlink.site) — optimized for 512 MB VPS deployments
# Multi-stage build: deps → builder → minimal runtime (~180 MB final image)
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
    AUTH_SECRET="build-time-placeholder-secret-value-0123456789"

# Generate the Prisma client (musl engine included via schema binaryTargets)
RUN npx prisma generate

RUN npm run build

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

# Prisma CLI + schema (for automatic schema sync on boot)
COPY --from=builder --chown=findlink:findlink /app/prisma ./prisma
COPY --from=builder --chown=findlink:findlink /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=findlink:findlink /app/node_modules/@prisma/engines ./node_modules/@prisma/engines
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
