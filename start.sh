#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"; cd "$root"
[ -f .env ] || { echo "Missing .env; copy .env.example." >&2; exit 1; }
[ -d server/node_modules ] && [ -d client/node_modules ] || { echo "Run scripts/bootstrap.sh first." >&2; exit 1; }
set -a; . ./.env; set +a
server_port="${SERVER_PORT:-${BACKEND_PORT:-3001}}"
client_port="${CLIENT_PORT:-${FRONTEND_PORT:-3000}}"
for port in "$server_port" "$client_port"; do
  ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 || { echo "Port $port is already in use." >&2; exit 1; }
done
if [[ "${MIGRATE_ON_START:-false}" == "true" ]]; then
  [[ "${ALLOW_SCHEMA_MIGRATION:-}" == "1" || "${ALLOW_SCHEMA_MIGRATION:-}" == "true" ]] || { echo "MIGRATE_ON_START requires ALLOW_SCHEMA_MIGRATION=1." >&2; exit 1; }
  bash "$root/scripts/migrate.sh"
  node "$root/server/create-admin.js"
fi
server_pid=''; client_pid=''
cleanup(){ [ -z "$server_pid" ] || kill "$server_pid" 2>/dev/null || true; [ -z "$client_pid" ] || kill "$client_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
(cd server && SERVER_PORT="$server_port" npm start) & server_pid=$!
(cd client && ./node_modules/.bin/vite --host 127.0.0.1 --port "$client_port") & client_pid=$!
wait "$server_pid" "$client_pid"
