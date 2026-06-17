# pe-cluster-openshift

**What this covers:** Standalone Terraform + platform repo for Red Hat OpenShift clusters.
**When to read:** Before provisioning an OpenShift cluster or registering a spoke.

---

## What This Repo Is

Self-contained repo to provision OpenShift clusters in a hub-and-spoke model.

The hub runs ArgoCD (OpenShift GitOps).
The hub is the only path that deploys workloads to the spokes.
Spokes are dev, test, prod.

This repo is OpenShift only.
No EKS, GKE, or AKS code.
No `var.cloud` switch — each workspace calls the openshift module directly.

---

## Directory Structure

```
pe-cluster-openshift/
├── terraform/
│   ├── modules/openshift/   openshift-install wrapper + install-config.yaml.tpl
│   ├── hub/                 Hub cluster (ArgoCD only, 3 masters + 2 workers)
│   ├── dev/                 Dev spoke (3 masters + 3 workers, m5.xlarge)
│   ├── test/                Test spoke (3 masters + 5 workers, m5.2xlarge)
│   └── prod/                Prod spoke (3 masters + 6 workers, m5.2xlarge)
├── platform/
│   ├── install.sh           Installs SCC binding, NetworkPolicies, cert-manager, ESO, ArgoCD
│   ├── register-spoke.sh    Registers a spoke with hub ArgoCD + ApplicationSet
│   ├── verify.sh            Health + invariant checks
│   └── manifests/           Namespaces, default-deny NetPol, SCC binding, monitoring
├── .github/workflows/
│   └── terraform.yml        fmt + init -backend=false + validate (module + each env)
└── README.md
```

---

## Prerequisites

| Tool | Version | Needed at |
|---|---|---|
| terraform | >= 1.6 (tested 1.14.5) | plan / apply |
| openshift-install | match target OCP version | apply only |
| oc | >= 4.14 | platform install + verify |
| helm | >= 3.14 | platform install |
| argocd CLI | >= 2.10 | register-spoke |

Apply-time credentials (NOT needed for `terraform validate`):

- Red Hat pull secret from console.redhat.com/openshift/install/pull-secret.
- SSH public key for node access.
- Cloud creds for the chosen platform (AWS / GCP / Azure), or none for bare-metal.

---

## Provision Flow — Hub + One Spoke

### Step 1: Provision the hub

```bash
cd terraform/hub
terraform init \
  -backend-config="bucket=YOUR-STATE-BUCKET" \
  -backend-config="key=openshift/hub/terraform.tfstate" \
  -backend-config="region=us-east-1"
terraform apply \
  -var="base_domain=yarova.ca" \
  -var="pull_secret=$(cat ~/ocp-pull-secret.json)" \
  -var="ssh_key=$(cat ~/.ssh/id_ed25519.pub)"
```

### Step 2: Load hub kubeconfig

```bash
eval "$(terraform output -raw kubeconfig_command)"
```

### Step 3: Install platform on the hub

```bash
bash ../../platform/install.sh --env hub
```

### Step 4: Provision a spoke (dev)

```bash
cd ../dev
terraform init -backend-config="key=openshift/dev/terraform.tfstate" ...
terraform apply -var="base_domain=yarova.ca" -var="pull_secret=..." -var="ssh_key=..."
eval "$(terraform output -raw kubeconfig_command)"
bash ../../platform/install.sh --env dev
```

### Step 5: Register the spoke with the hub

```bash
export KUBECONFIG=/path/to/HUB/kubeconfig
bash ../../platform/register-spoke.sh \
  --spoke-kubeconfig /path/to/DEV/kubeconfig \
  --spoke-name dev \
  --environment dev
```

### Step 6: Verify

```bash
export KUBECONFIG=/path/to/DEV/kubeconfig
bash ../../platform/verify.sh
```

---

## Hub-and-Spoke Model

The hub holds ArgoCD.
A spoke is registered to the hub ArgoCD as a managed cluster.
The hub creates an ApplicationSet that targets the spoke by `environment` label.

Workloads reach a spoke ONLY through that ApplicationSet.
No human runs `oc apply` of app workloads against a spoke.

---

## Cluster Invariants

Each invariant states how it is enforced and how it is verified.
`verify.sh` checks invariants 2, 3, 4, 5, 6.

---

### Invariant 1 — Three control-plane nodes per cluster

Enforce: module variable `control_plane_replicas` is validated to be 1 or 3.
Every env workspace sets it to 3.

Verify:
```bash
oc get nodes -l node-role.kubernetes.io/master= | grep -c Ready   # expect 3
```

---

### Invariant 2 — Workloads run non-root via SCC

Enforce: app service accounts are bound to the `restricted-v2` SCC only.
No binding grants `anyuid` or `privileged` in dev/test/prod.

Verify:
```bash
oc get scc restricted-v2
oc get pods -n prod -o jsonpath='{.items[*].metadata.annotations.openshift\.io/scc}' \
  | grep -Eq 'anyuid|privileged' && echo VIOLATION || echo OK
```

---

### Invariant 3 — Default-deny NetworkPolicy in every app namespace

Enforce: `network-policy-default-deny.yaml` applies a deny-all Ingress+Egress
policy plus a DNS-only egress allow in dev, test, prod.

Verify:
```bash
oc get networkpolicy default-deny-all -n prod
oc get networkpolicy default-deny-all -n dev
oc get networkpolicy default-deny-all -n test
```

---

### Invariant 4 — Secrets come from External Secrets Operator

Enforce: ESO is installed; cluster secrets sync from a cloud secret manager
through SecretStore + ExternalSecret, not committed to git.

Verify:
```bash
oc get pods -n external-secrets-system | grep -c Running   # expect >= 1
```

---

### Invariant 5 — TLS is automated (cert-manager + OpenShift-managed API TLS)

Enforce: cert-manager is installed for app certificates.
The cluster API and console TLS are OpenShift-managed (ingress operator).

Verify:
```bash
oc get pods -n cert-manager | grep -c Running          # expect >= 1
oc get clusteroperator ingress -o jsonpath='{.status.conditions[?(@.type=="Available")].status}'  # expect True
```

---

### Invariant 6 — Deploys to spokes are GitOps-only (ArgoCD)

Enforce: ArgoCD runs on the hub.
Spokes receive workloads only via the hub ApplicationSet, never manual apply.

Verify:
```bash
# On the hub:
oc get pods -n argocd | grep argocd-server | grep Running
argocd app list --selector environment=prod
```

---

### Invariant 7 — Pod Security Admission set to restricted on app namespaces

Enforce: namespaces are labeled
`pod-security.kubernetes.io/enforce: restricted` (defence in depth with SCCs).

Verify:
```bash
oc get ns prod -o jsonpath='{.metadata.labels.pod-security\.kubernetes\.io/enforce}'  # expect restricted
```

---

### Invariant 8 — Images pull from GHCR via a managed pull secret

Enforce: `ghcr-pull-secret` is created in dev/test/prod from `GITHUB_TOKEN`.
No image pulls rely on anonymous registry access.

Verify:
```bash
oc get secret ghcr-pull-secret -n prod
```

---

## CI — .github/workflows/terraform.yml

| Job | What it runs | Credentials |
|---|---|---|
| fmt | `terraform fmt -check -recursive` | none |
| validate-module | `init -backend=false` + `validate` on the module | none |
| validate-envs | same, matrixed over hub/dev/test/prod | none |
| check-secrets | detects whether `OCP_PULL_SECRET` is set | reads secret |
| pull-secret-smoke | `validate` with creds wired in | gated on `OCP_PULL_SECRET` |

No CI step calls `openshift-install`.
No CI step creates a cluster.
Missing `OCP_PULL_SECRET` skips the gated job — it does not fail the workflow.

---

## What Needs Real Credentials at Apply Time

`terraform validate` passes with no credentials.
`terraform apply` requires all of the following, or it fails fast:

- `openshift-install` binary on PATH (the module checks and errors if absent).
- `var.pull_secret` — a real Red Hat pull secret.
- `var.ssh_key` — a real SSH public key.
- Cloud credentials for the chosen `platform` (AWS/GCP/Azure), or `platform = none` for bare-metal.

---

## Destroying a Cluster

`terraform destroy` runs `openshift-install destroy cluster` against the run dir.

```bash
cd terraform/dev   # or test, prod, hub
terraform destroy -var="base_domain=yarova.ca" -var="pull_secret=..." -var="ssh_key=..."
```

Destroys all cluster resources including persistent volumes.
Confirm no live traffic before running against prod.
