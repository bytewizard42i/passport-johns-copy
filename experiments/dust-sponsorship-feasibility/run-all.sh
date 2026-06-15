#!/usr/bin/env bash
# run-all.sh — bring up the devnet, compile, deploy, and run every test case.
#
# Acceptance criterion: this single script reproduces the entire experiment
# end-to-end on a clean checkout. Anyone with the pinned SDK installed must
# be able to reproduce the findings.
#
# Prerequisites:
#   - Docker
#   - Node.js >= 22
#   - `compact` compiler on PATH
#   - openssl (for one-time .env generation)
#
# Usage:
#   ./run-all.sh              # run everything
#   ./run-all.sh --fresh      # reset chain state first
#   ./run-all.sh --tests f1   # run a subset (comma-separated test ids)
#
# Per-test evidence lands in evidence/<id>-<name>.json. After every test runs,
# `tsx src/compose-findings.ts` regenerates the results table in FINDINGS.md.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$SCRIPT_DIR/infra"
EVIDENCE_DIR="$SCRIPT_DIR/evidence"

# ── Args ────────────────────────────────────────────────────────────────────

FRESH=false
TESTS=""
for arg in "${@:-}"; do
  case $arg in
    --fresh) FRESH=true ;;
    --tests=*) TESTS="${arg#--tests=}" ;;
    --tests) shift; TESTS="${1:-}";;
  esac
done

ALL_TESTS=(f1 f2 f3 f4 f5 f6)
if [[ -n "$TESTS" ]]; then
  IFS=',' read -r -a SELECTED <<< "$TESTS"
else
  SELECTED=("${ALL_TESTS[@]}")
fi

# ── Prerequisites ───────────────────────────────────────────────────────────

check_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "ERROR: $1 not found"; exit 1; }; }
check_cmd docker
check_cmd node
check_cmd openssl
check_cmd compact

NODE_MAJOR=$(node --version | sed 's/v\([0-9]*\).*/\1/')
if [[ "$NODE_MAJOR" -lt 22 ]]; then
  echo "ERROR: Node 22+ required (found $(node --version))"
  exit 1
fi

# ── infra/.env ──────────────────────────────────────────────────────────────

if [[ ! -f "$INFRA_DIR/.env" ]]; then
  SECRET=$(openssl rand -hex 32)
  sed "s/^APP__INFRA__SECRET=$/APP__INFRA__SECRET=$SECRET/" "$SCRIPT_DIR/.env.example" > "$INFRA_DIR/.env"
  echo "infra/.env created (APP__INFRA__SECRET generated)"
fi

# Load .env into this shell so wallet seeds are available to tsx subprocesses.
set -a
source "$INFRA_DIR/.env"
set +a
export MIDNIGHT_NETWORK=local

# ── Build ───────────────────────────────────────────────────────────────────

cd "$SCRIPT_DIR"
echo "Installing npm dependencies..."
npm install --silent

echo "Compiling Compact contract..."
npm run compile

# ── Compose ─────────────────────────────────────────────────────────────────

COMPOSE_FILES="-f $INFRA_DIR/docker-compose.yml"
NODE_PORT=9944
INDEXER_PORT=8088
PROOF_PORT=6300
if [[ "$(uname -s)" == "Darwin" ]]; then
  COMPOSE_FILES="$COMPOSE_FILES -f $INFRA_DIR/docker-compose.macos.yml"
  # Host ports offset by 10000 — see docker-compose.macos.yml for the why.
  NODE_PORT=19944
  INDEXER_PORT=18088
  PROOF_PORT=16300
  export NODE_URL="http://localhost:$NODE_PORT"
  export INDEXER_URL="http://localhost:$INDEXER_PORT/api/v4/graphql"
  export INDEXER_WS_URL="ws://localhost:$INDEXER_PORT/api/v4/graphql/ws"
  export PROOF_SERVER_URL="http://127.0.0.1:$PROOF_PORT"
fi
COMPOSE="docker compose $COMPOSE_FILES"

if $FRESH; then
  echo ""
  echo "=== Resetting chain state ==="
  $COMPOSE down -v 2>/dev/null || true
  rm -rf midnight-level-db deployment.json
  sleep 2
fi

# ── Devnet ──────────────────────────────────────────────────────────────────

echo ""
echo "=== Starting local Midnight devnet ==="
$COMPOSE up -d node indexer proof-server

echo "Waiting for node..."
ELAPSED=0
until curl -sf http://localhost:$NODE_PORT/health > /dev/null 2>&1; do
  if (( ELAPSED >= 60 )); then
    echo "ERROR: node did not start within 60s"
    $COMPOSE logs node --tail 20
    exit 1
  fi
  printf "."; sleep 2; (( ELAPSED += 2 ))
done
echo " OK"

echo "Waiting for indexer..."
ELAPSED=0
until curl -sf http://localhost:$INDEXER_PORT/api/v4/graphql -H 'Content-Type: application/json' \
  -d '{"query":"{ __typename }"}' > /dev/null 2>&1; do
  if (( ELAPSED >= 120 )); then
    echo "WARN: indexer not ready after 120s"
    break
  fi
  printf "."; sleep 3; (( ELAPSED += 3 ))
done
echo " OK"

echo "Waiting for proof server..."
ELAPSED=0
until curl -sf http://localhost:$PROOF_PORT/version > /dev/null 2>&1; do
  if (( ELAPSED >= 30 )); then
    echo "WARN: proof server not responding"; break
  fi
  printf "."; sleep 2; (( ELAPSED += 2 ))
done
echo " OK"

# ── Deploy (F2 setup: sponsor-paid counter instance) ────────────────────────

mkdir -p "$EVIDENCE_DIR"

if printf '%s\n' "${SELECTED[@]}" | grep -qx 'f2' && [[ ! -f "deployment.json" ]]; then
  echo ""
  echo "=== Deploying counter contract (sponsor-paid, setup for F2) ==="
  npx tsx src/deploy.ts
fi

# ── Per-test execution ──────────────────────────────────────────────────────

test_file_for() {
  case "$1" in
    f1) echo "src/tests/f1-happy-path.ts" ;;
    f2) echo "src/tests/f2-zero-start-onboarding.ts" ;;
    f3) echo "src/tests/f3-rebalance-corruption.ts" ;;
    f4) echo "src/tests/f4-ttl-expiry.ts" ;;
    f5) echo "src/tests/f5-insufficient-sponsor-dust.ts" ;;
    f6) echo "src/tests/f6-sponsored-deployment.ts" ;;
    *)  echo "" ;;
  esac
}

upcase() { echo "$1" | tr '[:lower:]' '[:upper:]'; }

for tid in "${SELECTED[@]}"; do
  file=$(test_file_for "$tid")
  if [[ -z "$file" ]]; then
    echo "WARN: unknown test id '$tid', skipping"; continue
  fi
  TID_UPPER=$(upcase "$tid")
  echo ""
  echo "=== ${TID_UPPER}: ${file##*/} ==="
  npx tsx "$file" || true   # never abort the suite — collect every test's outcome
done

# ── Compose FINDINGS.md ─────────────────────────────────────────────────────

echo ""
echo "=== Composing FINDINGS.md from evidence ==="
npx tsx src/compose-findings.ts

echo ""
echo "=== Done ==="
echo "Evidence: $EVIDENCE_DIR"
echo "Report:   $SCRIPT_DIR/FINDINGS.md"
