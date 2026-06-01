#!/usr/bin/env bash
# Sets up Backstage portal for pipeline-studio.
# Run once: bash scripts/setup-backstage.sh
# Requires: Node 20+, npm, GITHUB_TOKEN env var set.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORTAL_DIR="$REPO_ROOT/../pipeline-studio-portal"

echo "Creating Backstage app at $PORTAL_DIR..."
cd "$REPO_ROOT/.."
npx @backstage/create-app@latest --skip-install --path pipeline-studio-portal --name pipeline-studio-portal

echo "Installing dependencies..."
cd pipeline-studio-portal
npm install

echo "Copying app-config.yaml..."
cp "$REPO_ROOT/backstage/app-config.yaml" ./app-config.yaml

echo "Copying catalog templates..."
mkdir -p ./examples
cp "$REPO_ROOT/backstage/catalog/all.yaml" ./examples/entities.yaml

echo "Done. To start:"
echo "  cd $PORTAL_DIR"
echo "  export GITHUB_TOKEN=ghp_..."
echo "  export AUTH_GITHUB_CLIENT_ID=..."
echo "  export AUTH_GITHUB_CLIENT_SECRET=..."
echo "  npm run dev"
echo ""
echo "Portal will be at http://localhost:3000"
