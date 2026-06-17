#!/usr/bin/env bash
# install.sh — installs platform components on an OpenShift cluster in order.
# Usage: KUBECONFIG=/path/to/kubeconfig bash install.sh --env hub|dev|test|prod
#
# OpenShift specifics handled here:
#   - SCCs (Security Context Constraints) replace PodSecurityPolicies.
#   - OpenShift Routes / built-in ingress replace ingress-nginx (no ingress-nginx installed).
#   - cert-manager is installed for app TLS; the cluster's own API/console TLS is OpenShift-managed.
#   - ArgoCD (OpenShift GitOps) runs on the hub only and is the ONLY deploy path to spokes.
#
# Safe to re-run: helm upgrade --install and oc apply are idempotent.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MANIFESTS="$REPO_ROOT/platform/manifests"
ENV=""

# Prefer oc on OpenShift; fall back to kubectl if oc is absent.
if command -v oc >/dev/null 2>&1; then
  KCTL="oc"
else
  KCTL="kubectl"
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    --env) ENV="$2"; shift 2 ;;
    *) shift ;;
  esac
done

[[ -z "$ENV" ]] && { echo "Usage: $0 --env hub|dev|test|prod"; exit 1; }
[[ -z "${KUBECONFIG:-}" ]] && { echo "ERROR: KUBECONFIG env var not set"; exit 1; }

$KCTL cluster-info >/dev/null 2>&1 || { echo "ERROR: cannot reach cluster. Check KUBECONFIG."; exit 1; }
echo "Installing OpenShift platform on: $ENV (using $KCTL)"
echo "============================================================"

# -- STEP 1: Namespaces + default-deny NetworkPolicies --------------------
echo "-> [1/8] Namespaces + default-deny NetworkPolicies..."
$KCTL apply -f "$MANIFESTS/namespaces.yaml"
$KCTL apply -f "$MANIFESTS/network-policy-default-deny.yaml"

# -- STEP 2: SCC binding (non-root enforcement) ---------------------------
echo "-> [2/8] SCCs — bind workloads to the restricted-v2 SCC (non-root)..."
# restricted-v2 is the OpenShift default for authenticated users.
# We explicitly bind service accounts in app namespaces to it so nothing
# silently escalates to anyuid/privileged.
$KCTL apply -f "$MANIFESTS/scc-restricted-binding.yaml"

# -- STEP 3: cert-manager (app TLS) ---------------------------------------
echo "-> [3/8] cert-manager (app certificate automation)..."
helm repo add jetstack https://charts.jetstack.io --force-update 2>/dev/null
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --version v1.16.0 \
  --set crds.enabled=true \
  --wait --timeout 5m

# -- STEP 4: External Secrets Operator ------------------------------------
echo "-> [4/8] External Secrets Operator (secret sync from cloud secret managers)..."
helm repo add external-secrets https://charts.external-secrets.io --force-update 2>/dev/null
helm upgrade --install external-secrets external-secrets/external-secrets \
  --namespace external-secrets-system --create-namespace \
  --wait --timeout 5m
echo "  NOTE: apply SecretStore config AFTER configuring the cloud IAM/Workload Identity role."

# -- STEP 5: ArgoCD / OpenShift GitOps (hub only) -------------------------
if [[ "$ENV" == "hub" ]]; then
  echo "-> [5/8] ArgoCD (OpenShift GitOps — hub only, sole deploy path)..."
  helm repo add argo https://argoproj.github.io/argo-helm --force-update 2>/dev/null
  helm upgrade --install argocd argo/argo-cd \
    --namespace argocd --create-namespace \
    --set server.replicas=2 \
    --set repoServer.replicas=2 \
    --wait --timeout 10m
  echo "  ArgoCD admin password: $($KCTL get secret argocd-initial-admin-secret -n argocd -o jsonpath='{.data.password}' | base64 -d)"
  echo "  ArgoCD UI: $KCTL port-forward svc/argocd-server -n argocd 8080:443"
else
  echo "-> [5/8] ArgoCD — SKIP (spoke cluster; the hub deploys here via GitOps)"
fi

# -- STEP 6: Prometheus rules (user-workload monitoring) ------------------
echo "-> [6/8] Enabling OpenShift user-workload monitoring + alert rules..."
# OpenShift ships Prometheus; we enable monitoring for user workloads instead
# of installing a second Prometheus stack.
$KCTL apply -f "$MANIFESTS/user-workload-monitoring.yaml"

# -- STEP 7: GHCR image pull secret ---------------------------------------
echo "-> [7/8] GHCR image pull secret..."
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  for ns in dev test prod; do
    $KCTL create secret docker-registry ghcr-pull-secret \
      --docker-server=ghcr.io \
      --docker-username="${GITHUB_USER:-yarova-ca}" \
      --docker-password="$GITHUB_TOKEN" \
      --namespace "$ns" --dry-run=client -o yaml | $KCTL apply -f - 2>/dev/null || true
  done
else
  echo "  WARNING: GITHUB_TOKEN not set — skipping image pull secret."
fi

# -- STEP 8: Verify -------------------------------------------------------
echo "-> [8/8] Done. Run verification:"
echo "  bash $REPO_ROOT/platform/verify.sh"

echo ""
echo "============================================================"
echo "Platform installation complete on $ENV cluster."
