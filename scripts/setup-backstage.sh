#!/usr/bin/env bash
# Sets up Backstage portal for pipeline-studio.
# Run once from the pipeline-studio repo root: bash scripts/setup-backstage.sh
# Requires: Node 18.x, 20.x, or 22.x LTS, npm 8+, git

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="pipeline-studio-portal"
PORTAL_DIR="$REPO_ROOT/../$APP_NAME"

# ── Step 1: Check Node.js version ──────────────────────────────────────────

NODE_VERSION="$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)"

if [[ -z "$NODE_VERSION" ]]; then
  echo "ERROR: Node.js is not installed."
  echo "Install Node 18, 20, or 22 from https://nodejs.org"
  exit 1
fi

if [[ "$NODE_VERSION" -ne 18 && "$NODE_VERSION" -ne 20 && "$NODE_VERSION" -ne 22 ]]; then
  echo "ERROR: Node.js version $NODE_VERSION is not supported."
  echo "Backstage requires Node 18, 20, or 22."
  echo "Current version: $(node --version)"
  echo "Install the correct version from https://nodejs.org"
  exit 1
fi

echo "Node.js version check passed: $(node --version)"

# ── Step 2: Create the Backstage app ───────────────────────────────────────

if [[ -d "$PORTAL_DIR" ]]; then
  echo "WARNING: $PORTAL_DIR already exists. Skipping app creation."
  echo "To start fresh: rm -rf $PORTAL_DIR and re-run this script."
else
  echo "Creating Backstage app at $PORTAL_DIR..."
  cd "$REPO_ROOT/.."
  # --skip-install skips npm install so we can control it in step 3
  npx @backstage/create-app@latest --skip-install <<< "$APP_NAME"
  echo "Backstage app created."
fi

# ── Step 3: Install dependencies ───────────────────────────────────────────

echo "Installing dependencies (this takes 2-4 minutes)..."
cd "$PORTAL_DIR"
yarn install
echo "Dependencies installed."

# ── Step 4: Copy app-config.yaml ───────────────────────────────────────────

echo "Copying app-config.yaml..."
cp "$REPO_ROOT/backstage/app-config.yaml" "$PORTAL_DIR/app-config.yaml"
echo "app-config.yaml copied."

# ── Step 5: Copy catalog/ ──────────────────────────────────────────────────

if [[ -d "$REPO_ROOT/backstage/catalog" ]]; then
  echo "Copying backstage/catalog/..."
  mkdir -p "$PORTAL_DIR/catalog"
  cp -r "$REPO_ROOT/backstage/catalog/." "$PORTAL_DIR/catalog/"
  echo "catalog/ copied."
else
  echo "SKIP: backstage/catalog/ not found at $REPO_ROOT/backstage/catalog"
fi

# ── Step 6: Copy templates/ ────────────────────────────────────────────────

if [[ -d "$REPO_ROOT/backstage/templates" ]]; then
  echo "Copying backstage/templates/..."
  mkdir -p "$PORTAL_DIR/templates"
  cp -r "$REPO_ROOT/backstage/templates/." "$PORTAL_DIR/templates/"
  echo "templates/ copied."
else
  echo "SKIP: backstage/templates/ not found at $REPO_ROOT/backstage/templates"
fi

# ── Step 7: Copy org/ ──────────────────────────────────────────────────────

if [[ -d "$REPO_ROOT/backstage/org" ]]; then
  echo "Copying backstage/org/..."
  mkdir -p "$PORTAL_DIR/org"
  cp -r "$REPO_ROOT/backstage/org/." "$PORTAL_DIR/org/"
  echo "org/ copied."
else
  echo "SKIP: backstage/org/ not found at $REPO_ROOT/backstage/org"
fi

# ── Done ───────────────────────────────────────────────────────────────────

echo ""
echo "========================================================"
echo "Setup complete. Backstage app is ready at:"
echo "  $PORTAL_DIR"
echo ""
echo "Next step: set environment variables, then start the app."
echo ""
echo "  export GITHUB_TOKEN=ghp_your_personal_access_token"
echo "  export AUTH_GITHUB_CLIENT_ID=your_oauth_app_client_id"
echo "  export AUTH_GITHUB_CLIENT_SECRET=your_oauth_app_client_secret"
echo ""
echo "Then run:"
echo "  cd $PORTAL_DIR"
echo "  npm run dev"
echo ""
echo "Portal opens at: http://localhost:3000"
echo ""
echo "========================================================"
echo "GitHub OAuth App — create one here:"
echo "  https://github.com/organizations/yarova-ca/settings/applications/new"
echo ""
echo "Required OAuth App settings:"
echo "  Application name:  Pipeline Studio Portal"
echo "  Homepage URL:      http://localhost:3000"
echo "  Callback URL:      http://localhost:7007/api/auth/github/handler/frame"
echo ""
echo "Full setup guide: backstage/GITHUB-OAUTH-SETUP.md"
echo "========================================================"
