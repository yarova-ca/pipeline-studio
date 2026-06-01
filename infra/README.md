# infra/

**What this covers:** Every Kubernetes platform component for pipeline-studio.

**When to read:** Before installing the cluster, adding a new service, or debugging a platform issue.

---

## Components

| Component | What it does | Why it's here |
|---|---|---|
| namespaces.yaml | Creates all cluster namespaces | Namespaces must exist before any workload deploys |
| cert-manager | Issues TLS certs from Let's Encrypt | Ingresses need valid HTTPS — cert-manager automates renewal |
| ingress-nginx | Routes external HTTP/S to services | Single load balancer entry point for all services |
| kyverno | Enforces security policies on every Pod | Prevents misconfigured containers from reaching the cluster |
| argocd | GitOps controller — deploys from this repo | Changes merged to main auto-deploy without manual kubectl |
| prometheus | Metrics collection and alerting | Visibility into pod health, latency, and resource usage |

---

## Installation Order

Run steps in this exact order.

Later steps depend on earlier ones completing successfully.

---

### Step 1 — Namespaces

```bash
kubectl apply -f infra/namespaces.yaml
```

Verify:

```bash
kubectl get namespaces | grep -E 'platform-system|argocd|monitoring|cert-manager|dev|staging|prod'
```

---

### Step 2 — cert-manager

```bash
# Install cert-manager CRDs and controller
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=available deployment/cert-manager -n cert-manager --timeout=120s
kubectl wait --for=condition=available deployment/cert-manager-webhook -n cert-manager --timeout=120s

# Apply ClusterIssuers
kubectl apply -f infra/cert-manager/cluster-issuer-staging.yaml
kubectl apply -f infra/cert-manager/cluster-issuer-prod.yaml
```

**Staging vs prod issuers:**

When testing TLS: use `letsencrypt-staging` — higher rate limits, not browser-trusted.

When going live: switch Ingress annotation to `letsencrypt-prod` — browser-trusted, 50 certs/week limit.

---

### Step 3 — ingress-nginx

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  -n platform-system \
  -f infra/ingress-nginx/values.yaml
```

Verify:

```bash
kubectl get svc ingress-nginx-controller -n platform-system
# Look for EXTERNAL-IP — this is the cluster's public IP
```

---

### Step 4 — kyverno

```bash
helm repo add kyverno https://kyverno.github.io/kyverno
helm repo update

helm install kyverno kyverno/kyverno -n platform-system

# Wait for kyverno to be ready
kubectl wait --for=condition=available deployment/kyverno -n platform-system --timeout=120s

# Apply all policies
kubectl apply -f infra/kyverno/
```

**Policy enforcement modes:**

`require-non-root` — enforce: blocks non-root pods in dev/staging/prod.

`require-resource-limits` — enforce: blocks pods without CPU+memory limits.

`require-signed-image` — enforce: blocks unsigned images in staging+prod.

`require-sbom-label` — audit: warns only (enforce after all services ship the label).

---

### Step 5 — ArgoCD

```bash
# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD server to be ready
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=180s

# Apply the AppProject (scopes allowed repos and namespaces)
kubectl apply -f infra/argocd/projects/pipeline-platform.yaml

# Apply the app-of-apps (triggers deployment of all services)
kubectl apply -f infra/argocd/app-of-apps.yaml

# Get initial admin password
kubectl get secret argocd-initial-admin-secret -n argocd \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

**How app-of-apps works:**

`infra/argocd/app-of-apps.yaml` is one ArgoCD Application that watches `infra/argocd/apps/`.

ArgoCD reads every `.yaml` in that directory and creates one Application per file.

Each Application watches a service's Helm chart directory and syncs it to the cluster.

When a service chart changes: ArgoCD detects the diff and re-applies automatically.

`prune: true` — resources deleted from git are deleted from the cluster.

`selfHeal: true` — manual kubectl changes are overwritten by the git state.

---

### Step 6 — Prometheus

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f infra/prometheus/values.yaml
```

**Before running in prod:**

Change `grafana.adminPassword` in `infra/prometheus/values.yaml` to a strong password.

Store the password in a Kubernetes Secret, not in the values file.

Verify:

```bash
kubectl get pods -n monitoring
# All pods should reach Running state within 3 minutes
```

Access Grafana (port-forward):

```bash
kubectl port-forward svc/monitoring-grafana -n monitoring 3000:80
# Open: http://localhost:3000
# Default login: admin / <password from values.yaml>
```

---

## ArgoCD App Manifest Reference

Each file in `infra/argocd/apps/` follows this pattern:

```yaml
spec:
  source:
    path: services/<name>/helm   # Helm chart directory for this service
    helm:
      valueFiles:
        - values.yaml            # Base values (all environments)
        - values.dev.yaml        # Dev overrides (image tag, replica count)
  destination:
    namespace: dev               # Target namespace — update per environment
```

To add a new service: copy any existing app file, update `name`, `path`, and `namespace`.

---

## Kyverno Policy Quick Reference

| Policy | Scope | Mode | What it blocks |
|---|---|---|---|
| require-non-root | dev, staging, prod | enforce | Pods running as root (UID < 1000) |
| require-resource-limits | dev, staging, prod | enforce | Pods missing CPU or memory limits |
| require-signed-image | staging, prod | enforce | Unsigned ghcr.io/yarova-ca images |
| require-sbom-label | prod | audit | Images missing revision label (warn only) |

---

## Troubleshooting

**Pod blocked by Kyverno:**

```bash
# See the policy violation reason
kubectl describe pod <pod-name> -n <namespace>
# Look for: "admission webhook" in Events
```

**ArgoCD app stuck OutOfSync:**

```bash
# Force a manual sync
argocd app sync <app-name>
# Or via UI: open app → click Sync
```

**cert-manager certificate not issuing:**

```bash
kubectl describe certificate <cert-name> -n <namespace>
kubectl describe certificaterequest -n <namespace>
# Look for ACME challenge errors
```

**ingress-nginx no EXTERNAL-IP:**

Single-node or local cluster: the LoadBalancer service stays Pending.

Fix: use `kubectl port-forward` for local access, or install MetalLB for bare-metal clusters.
