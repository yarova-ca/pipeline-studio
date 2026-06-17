#!/usr/bin/env bash
# register-spoke.sh — registers a spoke cluster with the hub ArgoCD.
# Run on the hub cluster (KUBECONFIG must point to hub).
# Usage: bash register-spoke.sh --spoke-kubeconfig FILE --spoke-name dev --environment dev

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Monorepo root holds infra/ manifests: 5 levels up from this script.
REPO_ROOT="${PIPELINE_STUDIO_ROOT:-$(cd "$SCRIPT_DIR/../../../../../" && pwd)}"

SPOKE_KUBECONFIG=""
SPOKE_NAME=""
ENVIRONMENT=""
HUB_KUBECONFIG="${KUBECONFIG:-}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --spoke-kubeconfig) SPOKE_KUBECONFIG="$2"; shift 2 ;;
    --spoke-name)       SPOKE_NAME="$2";       shift 2 ;;
    --environment)      ENVIRONMENT="$2";      shift 2 ;;
    --hub-kubeconfig)   HUB_KUBECONFIG="$2";   shift 2 ;;
    *) shift ;;
  esac
done

[[ -z "$SPOKE_KUBECONFIG" ]] && { echo "--spoke-kubeconfig required"; exit 1; }
[[ -z "$SPOKE_NAME"       ]] && { echo "--spoke-name required (e.g. dev)"; exit 1; }
[[ -z "$ENVIRONMENT"      ]] && { echo "--environment required (dev|test|prod)"; exit 1; }

echo "Registering spoke: $SPOKE_NAME ($ENVIRONMENT)"
export KUBECONFIG="${HUB_KUBECONFIG}"

# Get ArgoCD admin password from hub
ARGOCD_PASSWORD=$(kubectl get secret argocd-initial-admin-secret \
  -n argocd -o jsonpath='{.data.password}' | base64 -d)

# Login to ArgoCD CLI
argocd login localhost:8080 \
  --username admin \
  --password "$ARGOCD_PASSWORD" \
  --insecure \
  --port-forward \
  --port-forward-namespace argocd

# Add spoke cluster to ArgoCD
argocd cluster add \
  "$(kubectl config current-context --kubeconfig "$SPOKE_KUBECONFIG")" \
  --name "$SPOKE_NAME" \
  --kubeconfig "$SPOKE_KUBECONFIG" \
  --label environment="$ENVIRONMENT" \
  --yes

echo "✅ Spoke $SPOKE_NAME registered with hub ArgoCD"

# Create ArgoCD ApplicationSet for this environment
cat << EOF | kubectl apply -f - --kubeconfig "${HUB_KUBECONFIG}"
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: pipeline-${ENVIRONMENT}
  namespace: argocd
spec:
  generators:
    - clusters:
        selector:
          matchLabels:
            environment: "${ENVIRONMENT}"
  template:
    metadata:
      name: "{{name}}-services"
    spec:
      project: pipeline-platform
      source:
        repoURL: https://github.com/yarova-ca/pipeline-studio
        targetRevision: main
        path: infra/argocd/apps
      destination:
        server: "{{server}}"
        namespace: "${ENVIRONMENT}"
      syncPolicy:
        automated:
          prune: false
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
EOF

echo "✅ ApplicationSet created for $ENVIRONMENT — services will deploy automatically"
echo "   Watch progress: argocd app list --selector environment=$ENVIRONMENT"
