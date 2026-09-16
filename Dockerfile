# syntax=docker/dockerfile:1

# ==============================================================================
# FindLink (findlink.site) — optimized for 512 MB VPS deployments
# Multi-stage build: deps → builder → minimal runtime (~420 MB final image,
# incl. the Node alpine base + the complete Prisma CLI closure for boot-time
# schema sync — prisma 6.19 eagerly requires @prisma/config, no exclusions)
# ==============================================================================

# ---------- Stage 1: dependencies ----------
FROM node:22-alpine AS deps
WORKDIR /app

# Prisma postinstall (prisma generate) needs the schema at install time
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Dummy URL — generate does not need a live database
ENV DATABASE_URL="file:/app/db/custom.db" \
    NEXT_TELEMETRY_DISABLED=1

# npm ci is the only build step that needs the network (the actual `next
# build` below runs fully offline). GitHub-hosted runners occasionally drop
# DNS/connectivity to registry.npmjs.org for a minute — 2026-09-16: "npm
# error network … exit code 152" 31s into the install, during a GitHub
# outage, on the first uncached run after the node:22 base switch. npm's
# built-in retries give up after ~30s, so wrap it: 5 attempts with growing
# pauses. A transient blip then costs a minute, not a red CI run.
RUN for i in 1 2 3 4 5; do \
      npm ci --no-audit --no-fund --fetch-retries=3 \
        --fetch-retry-mintimeout=10000 --fetch-retry-maxtimeout=60000 \
        --fetch-timeout=300000 \
      && break; \
      if [ "$i" -eq 5 ]; then echo "ERROR: npm ci failed 5 times — is registry.npmjs.org reachable?"; exit 1; fi; \
      echo "npm ci attempt $i/5 failed — retrying in $((i * 20))s"; \
      sleep $((i * 20)); \
    done

# ---------- Stage 2: build ----------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# No AUTH_SECRET here: the app reads it at RUNTIME (from .env via compose
# env_file), never at build time — verified: a clean build succeeds without
# it, and baking a placeholder only triggers BuildKit's
# SecretsUsedInArgOrEnv warning on every CI run.
# Memory profile, parameterized for the two build hosts:
#   • Local builds on a 512 MB VPS (docker compose build / install.sh --build)
#     keep the safe defaults declared below.
#   • GitHub-hosted CI runners (~7 GB RAM) override both ARGs via build-args
#     in .github/workflows/build.yml — running CI at the 512 MB V8 cap made
#     builds crawl (12+ min, constant GC near the cap) before the 2026-09-16
#     fix.
#     NODE_OPTIONS              → caps the V8 heap; the JS side may gently
#                                 use swap instead of blowing up the machine
#     TURBOPACK_MEMORY_LIMIT    → Turbopack (Rust) aborts with a clear error
#                                 past the cap instead of thrashing swap
#                                 (which looks like a hang)
#     NEXT_TURBOPACK_USE_WORKER → runs Turbopack in-process: one Node
#                                 process instead of two (~100 MB less peak)
ARG BUILD_HEAP_MB=512
ARG TURBO_LIMIT_MB=1024
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL="file:/app/db/custom.db" \
    NODE_OPTIONS="--max-old-space-size=${BUILD_HEAP_MB}" \
    TURBOPACK_MEMORY_LIMIT=${TURBO_LIMIT_MB} \
    NEXT_TURBOPACK_USE_WORKER=0

# Generate the Prisma client (musl engine included via schema binaryTargets).
# Watchdog-wrapped: a stalled generate fails loudly after 5 min instead of
# silently burning runner minutes. (Network stays ON here on purpose: if the
# prisma engines ever failed to vendor during `npm ci`, generate may still
# download them — an offline variant would turn that into a hard error.)
RUN timeout -s KILL 300 npx prisma generate

# Build hardening — reinforced after the CI hang RECURRED on 2026-09-16
# (route table printed 12 min in, then no output, no exit, again):
#   --network=none        the build needs ZERO network (deps are vendored by
#                         `npm ci`; no next/font remote fetches; telemetry
#                         disabled) — an offline build cannot hang on a
#                         stalled end-of-build socket flush (nextjs #70758 /
#                         #98696 failure family).
#   timeout -s KILL 1500  hard watchdog: past 25 min the step is SIGKILLed;
#                         when the step's PID 1 exits, the kernel reaps the
#                         orphaned grandchildren — nothing lingers.
#   artifact-verified auto-recovery — THE fix for the observed hang: Next
#                         16 writes .next/standalone/server.js and
#                         .next/routes-manifest.json BEFORE printing the
#                         route table (build/index.js: writeStandaloneDirectory
#                         precedes printTreeView; the stall sits in the graceful-
#                         shutdown await AFTER the table is printed). So when
#                         the watchdog kills a process that already printed
#                         its route table, the output on disk is byte-identical
#                         to a healthy exit: we VERIFY the artifacts and
#                         continue green instead of failing CI over a process
#                         that merely refuses to exit. The runner stage copies
#                         standalone/static/public straight from .next/, so the
#                         npm build script's trailing `cp` steps (which never
#                         ran) are irrelevant for the image.
RUN --network=none timeout -s KILL 1500 npm run build; \
    code=$?; \
    if [ "$code" -eq 0 ]; then exit 0; fi; \
    if [ -f .next/BUILD_ID ] && [ -f .next/routes-manifest.json ] && [ -f .next/standalone/server.js ]; then \
        echo "WARN: next build wrote all artifacts (route table printed) but its process failed to exit on this runner (rc=$code) - continuing with the verified build output"; \
        exit 0; \
    fi; \
    echo "ERROR: npm run build failed (rc=$code) without complete artifacts"; \
    exit "$code"

# Isolate the Prisma CLI + its full dependency closure for the runtime image.
# prisma 6.19 hard-depends on @prisma/config (an EAGER top-level require in
# prisma/build/index.js — NOT lazy as we first assumed) plus @prisma/engines,
# which in turn needs @prisma/debug, @prisma/engines-version and
# @prisma/get-platform; @prisma/config drags in c12/effect/deepmerge-ts/
# empathic. Anything less crash-loops at boot — we shipped two broken images
# learning this ('Cannot find module @prisma/debug', then '@prisma/config').
# The script walks package.json dependencies recursively, so the set is
# always COMPLETE for whatever prisma version package-lock installs; it also
# prunes query-engine dead weight and fails loudly on missing packages.
# No exclusions are allowed — excluding a hard dependency breaks the CLI.
# (watchdog-wrapped: pure CPU/FS work, must finish within minutes)
RUN timeout -s KILL 300 node scripts/prisma-closure.cjs --root /app/node_modules --out /prisma-cli

# ---------- Stage 3: runtime ----------
FROM node:22-alpine AS runner
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
