#!/bin/sh
set -e

echo "┌──────────────────────────────────────────────┐"
echo "│  FindLink — starting                         │"
echo "└──────────────────────────────────────────────┘"

# Ensure the database directory is writable
mkdir -p /app/db 2>/dev/null || true

echo "=> Syncing database schema…"
node /app/node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

echo "=> Launching server on port ${PORT:-3000}…"
exec node server.js
