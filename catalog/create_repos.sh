#!/bin/bash
# Create one private GitHub repo per golden service: yarova-ca/pe-<folder>.
# Pushes ONLY tracked files (git archive) so no node_modules/build artifacts leak.
# Waits for the GitHub API rate limit to reset before starting.
ROOT=/mnt/c/Users/RohithY/yarova/pipeline-studio
cd "$ROOT" || exit 1

FOLDERS="api-aspnet-core api-axum api-fastapi api-gin api-ktor api-laravel api-nestjs api-phoenix api-rails api-spring-boot edge-hono mobile-expo mobile-flutter protocol-graphql-yoga protocol-grpc protocol-ws-node web-angular-ssr web-astro web-nextjs web-nuxt web-react web-sveltekit"

# 1) wait until the rate limit has headroom (rate_limit endpoint is itself free)
echo "Waiting for GitHub API rate limit to reset…"
while true; do
  rem=$(gh api rate_limit --jq '.resources.core.remaining' 2>/dev/null || echo 0)
  if [ "${rem:-0}" -gt 500 ]; then echo "rate limit OK ($rem remaining)"; break; fi
  reset=$(gh api rate_limit --jq '.resources.core.reset' 2>/dev/null || echo 0)
  now=$(date +%s)
  wait=$(( reset - now + 5 )); [ "$wait" -lt 5 ] && wait=15
  echo "  remaining=$rem — sleeping ${wait}s"
  sleep "$wait"
done

OK=0; FAIL=0; SKIP=0
for folder in $FOLDERS; do
  name="pe-$folder"
  if gh repo view "yarova-ca/$name" >/dev/null 2>&1; then
    echo "SKIP $name (already exists)"; SKIP=$((SKIP+1)); continue
  fi
  tmp=$(mktemp -d)
  git archive "HEAD:services/$folder" | tar -x -C "$tmp" || { echo "FAIL $name (archive)"; FAIL=$((FAIL+1)); rm -rf "$tmp"; continue; }
  (
    cd "$tmp" || exit 1
    git init -q -b main
    git add -A
    git -c user.email=rohith@yarova.ca -c user.name="Rohith Yadla" commit -q -m "Initial commit — Yarova golden service: $folder"
    gh repo create "yarova-ca/$name" --private --source=. --push \
      --description "Yarova platform-engineered golden service — $folder"
  )
  if [ $? -eq 0 ]; then echo "DONE $name"; OK=$((OK+1)); else echo "FAIL $name (create/push)"; FAIL=$((FAIL+1)); fi
  rm -rf "$tmp"
  sleep 2
done
echo "=============================="
echo "created=$OK  skipped=$SKIP  failed=$FAIL"
