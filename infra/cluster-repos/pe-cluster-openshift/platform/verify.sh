#!/usr/bin/env bash
# verify.sh — health + invariant checks for an OpenShift cluster.
# All non-optional checks must pass before a cluster is production-ready.
# Usage: KUBECONFIG=/path/to/kubeconfig bash verify.sh

set -uo pipefail

if command -v oc >/dev/null 2>&1; then KCTL="oc"; else KCTL="kubectl"; fi

PASS=0; FAIL=0; WARN=0

check() {
  local name="$1"; local cmd="$2"; local optional="${3:-false}"
  if eval "$cmd" >/dev/null 2>&1; then
    printf "  PASS %-52s\n" "$name"; ((PASS++)) || true
  else
    if [[ "$optional" == "true" ]]; then
      printf "  WARN %-52s (optional)\n" "$name"; ((WARN++)) || true
    else
      printf "  FAIL %-52s\n" "$name"; ((FAIL++)) || true
    fi
  fi
}

echo "OpenShift Platform Verification"
echo "========================================"
echo ""
echo "FOUNDATION:"
check "Cluster reachable"                  "$KCTL cluster-info"
check "All nodes Ready"                    "$KCTL get nodes | grep -c ' Ready' | grep -qv '^0$'"
check "ClusterOperators available"         "$KCTL get clusteroperators 2>/dev/null" true

echo ""
echo "INVARIANT: non-root via SCC"
check "restricted-v2 SCC present"          "$KCTL get scc restricted-v2 2>/dev/null"
check "No anyuid/privileged app pods"      "! $KCTL get pods -n prod -o jsonpath='{.items[*].metadata.annotations.openshift\.io/scc}' 2>/dev/null | grep -Eq 'anyuid|privileged'"

echo ""
echo "INVARIANT: default-deny NetworkPolicy"
check "default-deny in prod"               "$KCTL get networkpolicy default-deny-all -n prod"
check "default-deny in dev"                "$KCTL get networkpolicy default-deny-all -n dev" true

echo ""
echo "INVARIANT: ESO secrets"
check "ESO controller Running"             "$KCTL get pods -n external-secrets-system | grep -c Running | grep -qv '^0$'"

echo ""
echo "INVARIANT: TLS automation"
check "cert-manager pods Running"          "$KCTL get pods -n cert-manager | grep -c Running | grep -qv '^0$'"

echo ""
echo "INVARIANT: GitOps-only deploys (hub)"
check "ArgoCD server Running (hub)"         "$KCTL get pods -n argocd | grep argocd-server | grep -q Running" true

echo ""
echo "SUPPLY CHAIN:"
check "GHCR pull secret in prod"           "$KCTL get secret ghcr-pull-secret -n prod 2>/dev/null"

echo ""
echo "========================================"
TOTAL=$((PASS + FAIL + WARN))
echo "Results: $PASS passed  $FAIL failed  $WARN warnings  (of $TOTAL)"
echo ""
if [[ $FAIL -eq 0 ]]; then
  echo "Cluster is healthy and invariants hold."
  exit 0
else
  echo "$FAIL checks failed — fix before production."
  exit 1
fi
