#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; [ -f "$root/.env" ] || { echo "Missing .env" >&2; exit 1; }
set -a; . "$root/.env"; set +a; : "${DATABASE_URL:?DATABASE_URL required}"
(cd "$root/server" && node scripts/syncLegacyModels.js)
for migration in "$root"/server/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"; done
