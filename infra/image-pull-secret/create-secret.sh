#!/usr/bin/env bash
# Creates GHCR image pull secret in all service namespaces.
# GHCR (GitHub Container Registry): where all 105 service images are stored.
# Without this secret: Kubernetes returns ImagePullBackOff — pods never start.
#
# Usage: GITHUB_TOKEN=ghp_xxx bash infra/image-pull-secret/create-secret.sh
#
# Prerequisite: GITHUB_TOKEN must have read:packages scope.

set -euo pipefail

NAMESPACES=("dev" "staging" "prod")
GITHUB_USER="${GITHUB_USER:-rohithvarmayadla}"
TOKEN="${GITHUB_TOKEN:?GITHUB_TOKEN is required}"

for NS in "${NAMESPACES[@]}"; do
  echo "Creating GHCR pull secret in namespace: $NS"
  kubectl create secret docker-registry ghcr-pull-secret \
    --docker-server=ghcr.io \
    --docker-username="$GITHUB_USER" \
    --docker-password="$TOKEN" \
    --docker-email=rohith@yarova.ca \
    --namespace="$NS" \
    --dry-run=client -o yaml | kubectl apply -f -

  # Patch default service account to use the secret automatically
  kubectl patch serviceaccount default \
    --namespace="$NS" \
    -p '{"imagePullSecrets": [{"name": "ghcr-pull-secret"}]}'

  echo "  Done: $NS"
done
echo "GHCR pull secret installed in all namespaces."
