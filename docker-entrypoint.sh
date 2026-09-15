#!/bin/sh
set -e

echo "┌──────────────────────────────────────────────┐"
echo "│  FindLink — starting                         │"
echo "└──────────────────────────────────────────────┘"

# Ensure the database directory is writable
mkdir -p /app/db 2>/dev/null || true

echo "=> Syncing database schema…"
if ! node /app/node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss; then
  echo "✗ Database schema sync failed." >&2
  echo "  If the error above says 'Cannot find module @prisma/...' your image" >&2
  echo "  predates the fixed Dockerfile (incomplete Prisma CLI in the runtime" >&2
  echo "  stage). Update the repo, wait for the GitHub Actions image build," >&2
  echo "  then run: ./install.sh --update" >&2
  exit 1
fi

echo "=> Launching server on port ${PORT:-3000}…"
exec node server.js
