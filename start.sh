#!/bin/bash

# ============================================
# AI Election Integrity Monitor - Start Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════╗"
echo "║   AI Election Integrity Monitor              ║"
echo "║   Starting Application...                    ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^\s*$' | xargs)
  echo -e "${GREEN}✓ Environment loaded${NC}"
else
  echo -e "${RED}✗ .env file not found. Please create it.${NC}"
  exit 1
fi

SERVER_PORT=${SERVER_PORT:-3001}
CLIENT_PORT=${CLIENT_PORT:-3000}

# ---- Clean up used ports ----
echo -e "${YELLOW}→ Cleaning up ports ${SERVER_PORT} and ${CLIENT_PORT}...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}  Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

cleanup_port $SERVER_PORT
cleanup_port $CLIENT_PORT
echo -e "${GREEN}✓ Ports cleaned${NC}"

# ---- Check PostgreSQL ----
echo -e "${YELLOW}→ Checking PostgreSQL...${NC}"
if command -v pg_isready &> /dev/null; then
  if pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "${YELLOW}→ Starting PostgreSQL...${NC}"
    if command -v brew &> /dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
  fi
else
  echo -e "${YELLOW}⚠ pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ---- Create database if not exists ----
echo -e "${YELLOW}→ Ensuring database exists...${NC}"
DB_NAME=${DB_NAME:-election_integrity}
createdb -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} $DB_NAME 2>/dev/null || echo -e "${CYAN}  Database '$DB_NAME' already exists${NC}"
echo -e "${GREEN}✓ Database ready${NC}"

# ---- Install dependencies ----
echo -e "${YELLOW}→ Installing server dependencies...${NC}"
cd "$PROJECT_DIR/server"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Server dependencies installed${NC}"

echo -e "${YELLOW}→ Installing client dependencies...${NC}"
cd "$PROJECT_DIR/client"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Client dependencies installed${NC}"

# ---- Seed database ----
echo -e "${YELLOW}→ Seeding database...${NC}"
cd "$PROJECT_DIR/server"
node seeds/seed.js
echo -e "${GREEN}✓ Database seeded${NC}"

# ---- Start services with hot reload ----
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗"
echo -e "║   Starting Services with Hot Reload           ║"
echo -e "╚══════════════════════════════════════════════╝${NC}"
echo ""

# Start server with nodemon (hot reload)
cd "$PROJECT_DIR/server"
echo -e "${CYAN}→ Starting backend server on port ${SERVER_PORT} (nodemon)...${NC}"
npx nodemon index.js &
SERVER_PID=$!

# Start client with Vite (hot reload built-in)
cd "$PROJECT_DIR/client"
echo -e "${CYAN}→ Starting frontend on port ${CLIENT_PORT} (Vite HMR)...${NC}"
npx vite --port $CLIENT_PORT &
CLIENT_PID=$!

sleep 3

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗"
echo -e "║   Application Started Successfully!           ║"
echo -e "╠══════════════════════════════════════════════╣"
echo -e "║                                              ║"
echo -e "║   Frontend:  http://localhost:${CLIENT_PORT}          ║"
echo -e "║   Backend:   http://localhost:${SERVER_PORT}          ║"
echo -e "║                                              ║"
echo -e "║   Login:     admin@electionmonitor.gov       ║"
echo -e "║   Password:  Admin123!                       ║"
echo -e "║                                              ║"
echo -e "║   Press Ctrl+C to stop all services          ║"
echo -e "╚══════════════════════════════════════════════╝${NC}"
echo ""

# Cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}→ Shutting down services...${NC}"
  kill $SERVER_PID 2>/dev/null || true
  kill $CLIENT_PID 2>/dev/null || true
  cleanup_port $SERVER_PORT
  cleanup_port $CLIENT_PORT
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
