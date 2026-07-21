#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"; cd "$root"
[ -f .env ] || { echo "Missing .env; copy .env.example." >&2; exit 1; }
[ -d server/node_modules ] && [ -d client/node_modules ] || { echo "Run scripts/bootstrap.sh first." >&2; exit 1; }
server_pid=''; client_pid=''
cleanup(){ [ -z "$server_pid" ] || kill "$server_pid" 2>/dev/null || true; [ -z "$client_pid" ] || kill "$client_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
(cd server && npm start) & server_pid=$!
(cd client && npm run dev) & client_pid=$!
wait "$server_pid" "$client_pid"
