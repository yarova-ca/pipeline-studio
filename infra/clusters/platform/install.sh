#!/usr/bin/env bash
# install.sh — installs all platform components on a cluster.
# Run AFTER terraform creates the cluster.
# Usage: bash infra/clusters/platform/install.sh --env hub|dev|test|prod
#
# Install order matters:
#   1. cert-manager  — ArgoCD and ingress need TLS
#   2. ingress-nginx — cert-manager needs an ingress for ACME http01 challenge
#   3. Kyverno       — blocks non-compliant workloads before they run
#   4. ArgoCD        — manages all subsequent deployments via GitOps
#   5. ESO           — ExternalSecrets Operator: pulls secrets from AWS/GCP/Azure
#   6. Prometheus    — monitoring last: everything else is higher priority

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../" && pwd)"

ENV="${1:-}"
while [[ $# -gt 0 ]]; do
  case $1 in
    --env) ENV="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [[ -z "$ENV" ]]; then
  echo "Usage: $0 --env hub|dev|test|prod"
  exit 1
fi

echo "Installing platform on: $ENV cluster"
echo "Kubeconfig: $KUBECONFIG"
kubectl cluster-info || { echo "ERROR: cannot reach cluster — check KUBECONFIG"; exit 1; }

# ── Step 1: Namespaces and Resource Quotas ─────────────────────────────────
echo "→ Applying namespaces and resource quotas..."
kubectl apply -f "$REPO_ROOT/infra/namespaces.yaml"
kubectl apply -f "$REPO_ROOT/infra/namespace-quotas.yaml"

# ── Step 2: cert-manager ──────────────────────────────────────────────────
echo "→ Installing cert-manager..."
helm repo add jetstack https://charts.jetstack.io --force-update
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --version v1.16.0 \
  --set installCRDs=true \
  --wait --timeout 5m

# ── Step 3: ingress-nginx ─────────────────────────────────────────────────
echo "→ Installing ingress-nginx..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx --force-update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.replicaCount=2 \
  --wait --timeout 5m

# Wait for load balancer IP
echo "  Waiting for ingress external IP..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# ── Step 4: Kyverno ──────────────────────────────────────────────────────
echo "→ Installing Kyverno..."
helm repo add kyverno https://kyverno.github.io/kyverno/ --force-update
helm upgrade --install kyverno kyverno/kyverno \
  --namespace kyverno-system --create-namespace \
  --set replicaCount=1 \
  --wait --timeout 5m

echo "  Applying Kyverno policies..."
# Use audit mode for non-prod, enforce for prod
if [[ "$ENV" == "prod" ]]; then
  kubectl apply -f "$REPO_ROOT/infra/kyverno/"
else
  # Apply policies but override to audit mode
  for f in "$REPO_ROOT/infra/kyverno/"*.yaml; do
    sed 's/validationFailureAction: enforce/validationFailureAction: audit/g' "$f" | kubectl apply -f -
  done
fi

# ── Step 5: ArgoCD ───────────────────────────────────────────────────────
echo "→ Installing ArgoCD..."
helm repo add argo https://argoproj.github.io/argo-helm --force-update

if [[ "$ENV" == "hub" ]]; then
  # Hub gets full ArgoCD with multi-cluster support
  helm upgrade --install argocd argo/argo-cd \
    --namespace argocd --create-namespace \
    --set server.replicas=2 \
    --set repoServer.replicas=2 \
    --wait --timeout 10m
  echo "  ArgoCD installed. Access UI:"
  echo "  kubectl port-forward svc/argocd-server -n argocd 8080:443"
  echo "  Password: kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath='{.data.password}' | base64 -d"
else
  # Spokes don't need ArgoCD (hub manages them)
  echo "  Skipping ArgoCD on spoke cluster (hub manages this cluster)"
fi

# ── Step 6: External Secrets Operator ─────────────────────────────────────
echo "→ Installing External Secrets Operator..."
helm repo add external-secrets https://charts.external-secrets.io --force-update
helm upgrade --install external-secrets external-secrets/external-secrets \
  --namespace external-secrets-system --create-namespace \
  --wait --timeout 5m

# ── Step 7: Prometheus + Grafana ─────────────────────────────────────────
echo "→ Installing Prometheus + Grafana..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts --force-update
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  -f "$REPO_ROOT/infra/prometheus/values.yaml" \
  --wait --timeout 10m

kubectl apply -f "$REPO_ROOT/infra/prometheus/alerts.yaml"

echo ""
echo "✅ Platform installation complete on $ENV cluster!"
echo "Run verify.sh to confirm all components are healthy."
