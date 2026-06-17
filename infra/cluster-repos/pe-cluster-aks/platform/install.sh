#!/usr/bin/env bash
# install.sh — installs ALL platform components on a cluster in correct order.
# Each component depends on the ones before it.
# Usage: KUBECONFIG=/path/to/kubeconfig.yaml bash install.sh --env hub|dev|test|prod
#
# Duration: ~25-35 minutes for a full install.
# Safe to re-run: Helm upgrade --install is idempotent.

set -euo pipefail

# This is the AKS-only cluster repo. CLOUD is fixed to aks.
# Platform manifests (namespaces, kyverno, network-policies, etc.) live in the
# pipeline-studio monorepo. Point REPO_ROOT at that checkout:
#   PIPELINE_STUDIO_ROOT=/path/to/pipeline-studio bash install.sh --env dev
REPO_ROOT="${PIPELINE_STUDIO_ROOT:-$(cd "$(dirname "$0")/../../../../" && pwd)}"
ENV=""
CLOUD="aks"    # fixed — this repo provisions AKS only

while [[ $# -gt 0 ]]; do
  case $1 in
    --env)   ENV="$2";   shift 2 ;;
    --cloud) CLOUD="$2"; shift 2 ;;
    *) shift ;;
  esac
done

[[ -z "$ENV" ]] && { echo "Usage: $0 --env hub|dev|test|prod [--cloud eks|gke|aks|openshift]"; exit 1; }
[[ -z "$KUBECONFIG" ]] && { echo "ERROR: KUBECONFIG env var not set"; exit 1; }

kubectl cluster-info >/dev/null 2>&1 || { echo "ERROR: Cannot reach cluster. Check KUBECONFIG."; exit 1; }
echo "Installing platform on: $ENV ($CLOUD)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── STEP 1: Namespaces + Resource Quotas + Pod Security ────────────────────
echo "→ [1/22] Namespaces, quotas, pod security admission..."
kubectl apply -f "$REPO_ROOT/infra/namespaces.yaml"
kubectl apply -f "$REPO_ROOT/infra/namespace-quotas.yaml"

# ── STEP 2: Storage Classes ────────────────────────────────────────────────
echo "→ [2/22] Storage classes ($CLOUD)..."
if [[ "$CLOUD" == "eks" ]]; then
  kubectl apply -f "$REPO_ROOT/infra/storage/storage-classes.yaml" \
    --selector='metadata.name=fast'
elif [[ "$CLOUD" == "gke" ]]; then
  kubectl apply -f "$REPO_ROOT/infra/storage/storage-classes.yaml" \
    --selector='metadata.name=fast-gke'
elif [[ "$CLOUD" == "aks" ]]; then
  kubectl apply -f "$REPO_ROOT/infra/storage/storage-classes.yaml" \
    --selector='metadata.name=fast-aks'
else
  kubectl apply -f "$REPO_ROOT/infra/storage/storage-classes.yaml"
fi

# ── STEP 3: RBAC ──────────────────────────────────────────────────────────
echo "→ [3/22] RBAC roles and cluster roles..."
kubectl apply -f "$REPO_ROOT/infra/rbac/roles.yaml"

# ── STEP 4: cert-manager ──────────────────────────────────────────────────
echo "→ [4/22] cert-manager (TLS certificate automation)..."
helm repo add jetstack https://charts.jetstack.io --force-update 2>/dev/null
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --version v1.16.0 \
  --set crds.enabled=true \
  --wait --timeout 5m
kubectl apply -f "$REPO_ROOT/infra/cert-manager/"

# ── STEP 5: ingress-nginx ─────────────────────────────────────────────────
echo "→ [5/22] ingress-nginx (HTTP/HTTPS load balancer)..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx --force-update 2>/dev/null
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  -f "$REPO_ROOT/infra/ingress-nginx/values.yaml" \
  --wait --timeout 5m

# ── STEP 6: Kyverno + Policies ────────────────────────────────────────────
echo "→ [6/22] Kyverno (admission policies)..."
helm repo add kyverno https://kyverno.github.io/kyverno/ --force-update 2>/dev/null
helm upgrade --install kyverno kyverno/kyverno \
  --namespace kyverno-system --create-namespace \
  --set replicaCount=1 \
  --wait --timeout 5m

# Apply policies in correct mode (audit for non-prod, enforce for prod)
if [[ "$ENV" == "prod" ]]; then
  kubectl apply -f "$REPO_ROOT/infra/kyverno/"
else
  for f in "$REPO_ROOT/infra/kyverno/"*.yaml; do
    sed 's/validationFailureAction: enforce/validationFailureAction: audit/g' "$f" | kubectl apply -f -
  done
fi

# ── STEP 7: Network Policies ──────────────────────────────────────────────
echo "→ [7/22] Network policies (default-deny + allow rules)..."
for ns in dev staging prod; do
  for f in "$REPO_ROOT/infra/network-policies/"*.yaml; do
    sed "s/namespace: prod/namespace: $ns/g" "$f" | kubectl apply -f - 2>/dev/null || true
  done
done

# ── STEP 8: ArgoCD (hub only) ─────────────────────────────────────────────
if [[ "$ENV" == "hub" ]]; then
  echo "→ [8/22] ArgoCD (GitOps controller — hub only)..."
  helm repo add argo https://argoproj.github.io/argo-helm --force-update 2>/dev/null
  helm upgrade --install argocd argo/argo-cd \
    --namespace argocd --create-namespace \
    --set server.replicas=2 \
    --set repoServer.replicas=2 \
    --wait --timeout 10m
  echo "  ArgoCD admin password: $(kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath='{.data.password}' | base64 -d)"
  echo "  ArgoCD UI: kubectl port-forward svc/argocd-server -n argocd 8080:443"

  # Apply ArgoCD projects and app-of-apps
  kubectl apply -f "$REPO_ROOT/infra/argocd/projects/"
  kubectl apply -f "$REPO_ROOT/infra/argocd/app-of-apps.yaml"
else
  echo "→ [8/22] ArgoCD — SKIP (spoke cluster, hub manages this)"
fi

# ── STEP 9: External Secrets Operator ─────────────────────────────────────
echo "→ [9/22] External Secrets Operator (secret sync from AWS/GCP/Azure)..."
helm repo add external-secrets https://charts.external-secrets.io --force-update 2>/dev/null
helm upgrade --install external-secrets external-secrets/external-secrets \
  --namespace external-secrets-system --create-namespace \
  --wait --timeout 5m
echo "  NOTE: Apply SecretStore config from infra/external-secrets/ AFTER configuring IAM role."

# ── STEP 10: CloudNativePG Operator + PostgreSQL Cluster ──────────────────
echo "→ [10/22] CloudNativePG operator + PostgreSQL cluster (3 instances)..."
kubectl apply -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/main/releases/cnpg-1.23.0.yaml
kubectl rollout status deployment/cnpg-controller-manager -n cnpg-system --timeout=120s
if [[ "$ENV" == "prod" || "$ENV" == "staging" ]]; then
  kubectl apply -f "$REPO_ROOT/infra/postgresql/cluster.yaml"
  kubectl apply -f "$REPO_ROOT/infra/postgresql/backup-schedule.yaml"
  echo "  Waiting for PostgreSQL primary to be ready..."
  kubectl wait --for=condition=Ready cluster/pipeline-postgres -n prod --timeout=300s || echo "  (cluster still initialising — check status with kubectl get cluster -n prod)"
fi

# ── STEP 11: Redis (Sentinel mode) ────────────────────────────────────────
echo "→ [11/22] Redis Sentinel (HA in-memory cache for token blacklist + rate limiting)..."
helm repo add bitnami https://charts.bitnami.com/bitnami --force-update 2>/dev/null
helm upgrade --install redis bitnami/redis \
  --namespace prod --create-namespace \
  -f "$REPO_ROOT/infra/redis/values.yaml" \
  --wait --timeout 5m

# ── STEP 12: Prometheus + Grafana + Alertmanager ──────────────────────────
echo "→ [12/22] Prometheus + Grafana + Alertmanager (metrics + dashboards + alerts)..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts --force-update 2>/dev/null
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  -f "$REPO_ROOT/infra/prometheus/values.yaml" \
  --wait --timeout 10m
kubectl apply -f "$REPO_ROOT/infra/prometheus/alerts.yaml"

# ── STEP 13: Loki + Promtail (log aggregation) ────────────────────────────
echo "→ [13/22] Loki + Promtail (log aggregation — where structured JSON logs go)..."
helm repo add grafana https://grafana.github.io/helm-charts --force-update 2>/dev/null
helm upgrade --install loki grafana/loki-stack \
  --namespace monitoring \
  -f "$REPO_ROOT/infra/loki/values.yaml" \
  --wait --timeout 5m
kubectl apply -f "$REPO_ROOT/infra/loki/datasource-configmap.yaml"

# ── STEP 14: Tempo (distributed tracing) ──────────────────────────────────
echo "→ [14/22] Tempo (distributed tracing backend — where OTel spans go)..."
helm upgrade --install tempo grafana/tempo \
  --namespace monitoring \
  -f "$REPO_ROOT/infra/tempo/values.yaml" \
  --wait --timeout 5m
kubectl apply -f "$REPO_ROOT/infra/tempo/datasource-configmap.yaml"

# ── STEP 15: Falco (runtime security) ─────────────────────────────────────
echo "→ [15/22] Falco (runtime security — detects container attacks via eBPF)..."
helm repo add falcosecurity https://falcosecurity.github.io/charts --force-update 2>/dev/null
helm upgrade --install falco falcosecurity/falco \
  --namespace falco --create-namespace \
  -f "$REPO_ROOT/infra/falco/values.yaml" \
  --set-file falco.customRules."custom-rules\.yaml"="$REPO_ROOT/infra/falco/custom-rules.yaml" \
  --wait --timeout 5m

# ── STEP 16: Velero (cluster backup) ──────────────────────────────────────
echo "→ [16/22] Velero (backup K8s resources + PVC snapshots)..."
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts --force-update 2>/dev/null
helm upgrade --install velero vmware-tanzu/velero \
  --namespace velero --create-namespace \
  -f "$REPO_ROOT/infra/velero/values.yaml" \
  --wait --timeout 5m
kubectl apply -f "$REPO_ROOT/infra/velero/schedule.yaml"

# ── STEP 17: ExternalDNS (auto DNS records) ───────────────────────────────
echo "→ [17/22] ExternalDNS (auto-creates DNS records for Ingress objects)..."
helm upgrade --install external-dns bitnami/external-dns \
  --namespace external-dns --create-namespace \
  -f "$REPO_ROOT/infra/external-dns/values.yaml" \
  --wait --timeout 3m

# ── STEP 18: OpenCost (cost attribution) ──────────────────────────────────
echo "→ [18/22] OpenCost (cost per namespace/service)..."
helm repo add opencost https://opencost.github.io/opencost-helm-chart --force-update 2>/dev/null
helm upgrade --install opencost opencost/opencost \
  --namespace opencost --create-namespace \
  -f "$REPO_ROOT/infra/opencost/values.yaml" \
  --wait --timeout 3m

# ── STEP 19: Trivy Operator (continuous CVE scanning) ─────────────────────
echo "→ [19/22] Trivy Operator (continuous CVE scanning of running images)..."
helm repo add aquasecurity https://aquasecurity.github.io/helm-charts/ --force-update 2>/dev/null
helm upgrade --install trivy-operator aquasecurity/trivy-operator \
  --namespace trivy-system --create-namespace \
  -f "$REPO_ROOT/infra/trivy/values.yaml" \
  --wait --timeout 5m

# ── STEP 20: Backstage (hub only) ─────────────────────────────────────────
if [[ "$ENV" == "hub" ]]; then
  echo "→ [20/22] Backstage (developer portal — hub only)..."
  kubectl apply -f "$REPO_ROOT/infra/backstage/deployment.yaml"
else
  echo "→ [20/22] Backstage — SKIP (spoke cluster)"
fi

# ── STEP 21: GHCR Image Pull Secrets ──────────────────────────────────────
echo "→ [21/22] GHCR image pull secrets (required to pull service images)..."
if [[ -n "${GITHUB_TOKEN:-}" ]]; then
  bash "$REPO_ROOT/infra/image-pull-secret/create-secret.sh"
else
  echo "  WARNING: GITHUB_TOKEN not set — skip image pull secret. Set it and re-run:"
  echo "  GITHUB_TOKEN=ghp_xxx bash infra/image-pull-secret/create-secret.sh"
fi

# ── STEP 22: Argo Rollouts (canary deployments) ───────────────────────────
echo "→ [22/22] Argo Rollouts (canary deployments with auto-rollback)..."
helm upgrade --install argo-rollouts argo/argo-rollouts \
  --namespace argo-rollouts --create-namespace \
  --wait --timeout 5m
kubectl apply -f "$REPO_ROOT/infra/argo-rollouts/"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Platform installation complete on $ENV cluster!"
echo ""
echo "Run verification:"
echo "  bash infra/clusters/platform/verify.sh"
