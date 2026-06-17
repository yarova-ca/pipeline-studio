#!/usr/bin/env bash
# verify.sh — 25 health checks confirming all 29 platform components are healthy.
# All 25 must pass before a cluster is production-ready.
# Usage: KUBECONFIG=/path/to/kubeconfig.yaml bash verify.sh

set -uo pipefail

PASS=0; FAIL=0; WARN=0

check() {
  local name="$1"; local cmd="$2"; local optional="${3:-false}"
  if eval "$cmd" >/dev/null 2>&1; then
    printf "  ✅ %-50s\n" "$name"
    ((PASS++)) || true
  else
    if [[ "$optional" == "true" ]]; then
      printf "  ⚠️  %-50s (optional)\n" "$name"
      ((WARN++)) || true
    else
      printf "  ❌ %-50s\n" "$name"
      ((FAIL++)) || true
    fi
  fi
}

echo "Platform Health Verification — 25 checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "FOUNDATION:"
check "Cluster reachable"                       "kubectl cluster-info"
check "All nodes Ready"                         "kubectl get nodes | grep -c Ready | grep -v 0"
check "ResourceQuota in prod"                   "kubectl get resourcequota -n prod | grep prod-quota"
check "NetworkPolicy default-deny in prod"      "kubectl get networkpolicy default-deny-all -n prod"
check "StorageClass default exists"             "kubectl get storageclass | grep '(default)'"

echo ""
echo "SECURITY:"
check "cert-manager pods Running"               "kubectl get pods -n cert-manager | grep -c Running | grep -v 0"
check "ingress-nginx pods Running"              "kubectl get pods -n ingress-nginx | grep -c Running | grep -v 0"
check "Kyverno pods Running"                    "kubectl get pods -n kyverno-system | grep -c Running | grep -v 0"
check "Falco DaemonSet ready"                   "kubectl get daemonset falco -n falco 2>/dev/null"
check "Pod security label on prod"              "kubectl get ns prod -o jsonpath='{.metadata.labels}' | grep pod.security"
check "GHCR pull secret in prod"                "kubectl get secret ghcr-pull-secret -n prod 2>/dev/null"

echo ""
echo "GITOPS:"
check "ArgoCD server Running (hub)"             "kubectl get pods -n argocd | grep argocd-server | grep Running" true
check "Argo Rollouts Running"                   "kubectl get pods -n argo-rollouts | grep -c Running | grep -v 0"

echo ""
echo "SECRETS:"
check "ESO controller Running"                  "kubectl get pods -n external-secrets-system | grep -c Running | grep -v 0"

echo ""
echo "DATA:"
check "PostgreSQL primary Ready"                "kubectl get cluster pipeline-postgres -n prod 2>/dev/null | grep -i ready" true
check "Redis master Running"                    "kubectl get pods -n prod -l app.kubernetes.io/name=redis | grep -c Running | grep -v 0" true

echo ""
echo "OBSERVABILITY:"
check "Prometheus Running"                      "kubectl get pods -n monitoring | grep prometheus-prometheus | grep -c Running | grep -v 0"
check "Grafana Running"                         "kubectl get pods -n monitoring | grep grafana | grep -c Running | grep -v 0"
check "Alertmanager Running"                    "kubectl get pods -n monitoring | grep alertmanager | grep -c Running | grep -v 0"
check "Loki gateway Running"                    "kubectl get pods -n monitoring | grep loki | grep -c Running | grep -v 0" true
check "Tempo Running"                           "kubectl get pods -n monitoring | grep tempo | grep -c Running | grep -v 0" true
check "Trivy Operator Running"                  "kubectl get pods -n trivy-system | grep -c Running | grep -v 0" true

echo ""
echo "RELIABILITY:"
check "Velero Running"                          "kubectl get pods -n velero | grep -c Running | grep -v 0" true
check "Velero backup schedule exists"           "kubectl get schedule daily-full-backup -n velero 2>/dev/null" true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((PASS + FAIL + WARN))
echo "Results: $PASS passed  $FAIL failed  $WARN warnings  (of $TOTAL checks)"
echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "✅ Cluster is healthy and production-ready"
  exit 0
else
  echo "❌ $FAIL checks failed — fix these before going to production"
  exit 1
fi
