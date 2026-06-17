#!/bin/bash
# Push the current monorepo state of each service to its standalone pe-* repo.
# Replaces repo contents with the tracked files (git archive) → no artifacts.
# A new commit triggers the (now-fixed) GitHub Actions.
ROOT=/mnt/c/Users/RohithY/yarova/pipeline-studio
FOLDERS="api-aspnet-core api-axum api-fastapi api-gin api-ktor api-laravel api-nestjs api-phoenix api-rails api-spring-boot edge-hono mobile-expo mobile-flutter protocol-graphql-yoga protocol-grpc protocol-ws-node web-angular-ssr web-astro web-nextjs web-nuxt web-react web-sveltekit"

ok=0; nochange=0; fail=0
for folder in $FOLDERS; do
  name="pe-$folder"
  tmp=$(mktemp -d)
  if ! git clone --depth 1 -q "https://github.com/yarova-ca/$name.git" "$tmp/repo" 2>/dev/null; then
    echo "CLONEFAIL $name"; fail=$((fail+1)); rm -rf "$tmp"; continue
  fi
  (
    cd "$tmp/repo" || exit 1
    git rm -rq . >/dev/null 2>&1
    ( cd "$ROOT" && git archive "HEAD:services/$folder" ) | tar -x -C .
    git add -A
    if git diff --cached --quiet; then echo "NOCHANGE $name"; exit 3; fi
    git -c user.email=rohith@yarova.ca -c user.name="Rohith Yadla" commit -q -m "Apply platform CI fixes + uniform compliance + integration manifests"
    git push -q origin HEAD:main
  )
  rc=$?
  if [ $rc -eq 0 ]; then echo "SYNCED $name"; ok=$((ok+1))
  elif [ $rc -eq 3 ]; then nochange=$((nochange+1))
  else echo "PUSHFAIL $name"; fail=$((fail+1)); fi
  rm -rf "$tmp"
done
echo "=============================="
echo "synced=$ok nochange=$nochange failed=$fail"
