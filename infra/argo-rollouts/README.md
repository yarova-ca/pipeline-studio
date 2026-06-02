# Argo Rollouts — Canary Deployments + Auto-Rollback

Argo Rollouts (canary deployment controller): replaces native Kubernetes Deployment
for gradual traffic shifting with automatic analysis and rollback.

## Why canary vs RollingUpdate

RollingUpdate: all replicas switch at once (plus maxSurge).
Canary: route 10% → 50% → 100% with analysis between each step.

When error rate exceeds threshold at 10%: auto-rollback to previous version.
When RollingUpdate fails: all replicas are already on the new broken version.

## Install

helm repo add argo https://argoproj.github.io/argo-helm
helm install argo-rollouts argo/argo-rollouts -n argo-rollouts --create-namespace

## How it works for pipeline-studio

1. CI pushes new image to GHCR: ghcr.io/yarova-ca/14-express:abc123
2. ArgoCD detects new image tag in values.yaml
3. Argo Rollouts starts canary: routes 10% of traffic to new version
4. AnalysisRun fires: checks error rate + latency from Prometheus
5. If metrics pass: promote to 50%, then 100%
6. If metrics fail: auto-rollback to previous version, alert fires
