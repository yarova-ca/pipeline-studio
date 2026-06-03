#!/usr/bin/env bash
# verify.sh — 10 health checks confirming a cluster is fully operational.
# Usage: bash verify.sh [--kubeconfig FILE]
# All 10 checks must pass before a cluster is considered production-ready.

set -euo pipefail

PASS=0
FAIL=0

while [[ $# -gt 0 ]]; do
  case $1 in
    --kubeconfig) export KUBECONFIG="$2"; shift 2 ;;
    *) shift ;;
  esac
done

check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" &>/dev/null; then
    echo "  ✅ $name"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $name"
    FAIL=$((FAIL + 1))
  fi
}

echo "Running 10 cluster health checks..."
echo ""

check "1. Cluster reachable"              "kubectl cluster-info"
check "2. All nodes Ready"                "kubectl get nodes | grep -v NotReady | grep Ready"
check "3. cert-manager running"           "kubectl get pods -n cert-manager | grep Running"
check "4. ingress-nginx running"          "kubectl get pods -n ingress-nginx | grep Running"
check "5. Kyverno running"                "kubectl get pods -n kyverno-system | grep Running"
check "6. ArgoCD running (hub only)"      "kubectl get pods -n argocd | grep Running"
check "7. ESO running"                    "kubectl get pods -n external-secrets-system | grep Running"
check "8. Prometheus running"             "kubectl get pods -n monitoring | grep prometheus | grep Running"
check "9. No pods in CrashLoopBackOff"    "! kubectl get pods --all-namespaces | grep CrashLoopBackOff"
check "10. No pods in Error state"        "! kubectl get pods --all-namespaces | grep ' Error '"

echo ""
echo "Results: $PASS passed, $FAIL failed"

if [[ $FAIL -eq 0 ]]; then
  echo "✅ Cluster is healthy and ready"
else
  echo "❌ Fix the failed checks before proceeding"
fi

exit $FAIL
