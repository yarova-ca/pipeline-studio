#!/bin/bash
# Wait for the GitHub API rate limit, flip all 23 repos to public, then trigger
# their Actions with an empty commit (public repos run Actions free, no billing).
ROOT=/mnt/c/Users/RohithY/yarova/pipeline-studio
FOLDERS="api-aspnet-core api-axum api-fastapi api-gin api-ktor api-laravel api-nestjs api-phoenix api-rails api-spring-boot edge-hono mobile-expo mobile-flutter protocol-graphql-yoga protocol-grpc protocol-ws-node web-angular-ssr web-astro web-nextjs web-nuxt web-react web-sveltekit"

echo "Waiting for rate limit…"
while true; do
  rem=$(gh api rate_limit --jq '.resources.core.remaining' 2>/dev/null || echo 0)
  [ "${rem:-0}" -gt 300 ] && { echo "rate OK ($rem)"; break; }
  reset=$(gh api rate_limit --jq '.resources.core.reset' 2>/dev/null || echo 0)
  wait=$(( reset - $(date +%s) + 5 )); [ "$wait" -lt 5 ] && wait=15
  echo "  remaining=$rem sleeping ${wait}s"; sleep "$wait"
done

echo "== Phase 1: make public =="
pub=0
for f in $FOLDERS; do
  if gh repo edit "yarova-ca/pe-$f" --visibility public --accept-visibility-change-consequences >/dev/null 2>&1; then
    echo "PUBLIC pe-$f"; pub=$((pub+1)); else echo "FAIL pe-$f"; fi
done
gh repo edit yarova-ca/pipeline-studio --visibility public --accept-visibility-change-consequences >/dev/null 2>&1 \
  && echo "PUBLIC pipeline-studio" || echo "FAIL pipeline-studio"

echo "== Phase 2: trigger Actions (empty commit) =="
trig=0
for f in $FOLDERS; do
  tmp=$(mktemp -d)
  if git clone --depth 1 "https://github.com/yarova-ca/pe-$f.git" "$tmp" >/dev/null 2>&1; then
    ( cd "$tmp"
      git -c user.email=rohith@yarova.ca -c user.name="Rohith Yadla" commit --allow-empty -q -m "ci: trigger Actions"
      git push -q origin HEAD:main ) && { echo "TRIGGER pe-$f"; trig=$((trig+1)); } || echo "PUSHFAIL pe-$f"
  else echo "CLONEFAIL pe-$f"; fi
  rm -rf "$tmp"
done
echo "=============================="
echo "public=$pub triggered=$trig"
