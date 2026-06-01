#!/usr/bin/env bash
# Build all services with a Dockerfile.
# Usage: bash scripts/build_all.sh
# Output: build-results.log (pass/fail per service + error tail on fail)

set -euo pipefail

SERVICES_DIR="$(cd "$(dirname "$0")/../services" && pwd)"
LOG="$(cd "$(dirname "$0")/.." && pwd)/build-results.log"
PASS=0
FAIL=0
SKIP=0

> "$LOG"

for svc_dir in "$SERVICES_DIR"/*/; do
  slug=$(basename "$svc_dir")
  dockerfile="$svc_dir/Dockerfile"

  if [[ ! -f "$dockerfile" ]]; then
    echo "SKIP  $slug  (no Dockerfile)" | tee -a "$LOG"
    ((SKIP++)) || true
    continue
  fi

  echo -n "BUILD $slug ... "
  tmp_log=$(mktemp)

  if docker build \
      --target runtime \
      -t "service-starters/${slug}:test" \
      -f "$dockerfile" \
      "$svc_dir" \
      > "$tmp_log" 2>&1; then
    echo "✅ PASS"
    echo "PASS  $slug" >> "$LOG"
    ((PASS++)) || true
  else
    echo "❌ FAIL"
    echo "FAIL  $slug" >> "$LOG"
    echo "--- last 20 lines ---" >> "$LOG"
    tail -20 "$tmp_log" >> "$LOG"
    echo "---------------------" >> "$LOG"
    ((FAIL++)) || true
  fi

  rm -f "$tmp_log"
done

echo ""
echo "=============================="
echo "✅ PASS: $PASS"
echo "❌ FAIL: $FAIL"
echo "⏭  SKIP: $SKIP (CI-only, no Dockerfile)"
echo "=============================="
echo "Full log: $LOG"
