# pe-cluster-gke

**What this covers:** Standalone GKE cluster repo for Pipeline Studio.
**When to read:** Before provisioning a GKE cluster or registering a spoke.

---

## What This Repo Is

A self-contained Terraform + platform repo for Google GKE only.

No EKS. No AKS. No OpenShift. No `var.cloud` switch.

Each env calls the GKE module directly.

GKE runs in Autopilot mode.
Autopilot definition: Google fully manages nodes, scaling, patching, security.

Workload Identity is on.
Workload Identity definition: pods get a GCP identity without static key files.

---

## Directory Structure

```
pe-cluster-gke/
├── terraform/
│   ├── modules/
│   │   └── gke/         GKE Autopilot + Workload Identity + ESO/ArgoCD GCP SAs
│   ├── hub/             Hub cluster — ArgoCD + management tools only
│   ├── dev/             Dev spoke — 1 replica, audit Kyverno
│   ├── test/            Test spoke — 2 replicas, prod-like limits
│   └── prod/            Prod spoke — 3+ replicas, enforce Kyverno, deletion protection
├── platform/
│   ├── install.sh       Installs cert-manager, ingress, Kyverno, ArgoCD, ESO, observability
│   ├── register-spoke.sh Registers a spoke with hub ArgoCD + creates ApplicationSet
│   └── verify.sh        25-check cluster health verification
├── .github/workflows/
│   └── terraform.yml    fmt + validate always; plan only if GCP creds present
└── README.md            This file
```

---

## Hub-and-Spoke for GKE

One hub cluster runs ArgoCD.
ArgoCD definition: the GitOps controller that deploys all services.

Three spoke clusters run workloads: dev, test, prod.

The hub never runs user services.
Why dedicated hub: if prod is overloaded, the hub stays available to manage it.

Spokes never run their own ArgoCD.
Why: one ArgoCD on the hub is the single source of deploy truth.

| Cluster | Runs ArgoCD | Runs services | Kyverno mode | Deletion protection |
|---|---|---|---|---|
| hub | Yes | No | enforce | No |
| dev | No | Yes | audit | No |
| test | No | Yes | audit | No |
| prod | No | Yes | enforce | Yes |

---

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Terraform | 1.14.5 | Provision clusters and GCP service accounts |
| gcloud CLI | latest | Fetch kubeconfig, manage project APIs |
| kubectl | >= 1.28 | Apply manifests, run verify |
| helm | >= 3.14 | Install platform Helm charts |
| argocd CLI | >= 2.10 | Register spokes with the hub |

Enable these GCP APIs in the project before apply:
- container.googleapis.com
- compute.googleapis.com
- iam.googleapis.com
- secretmanager.googleapis.com

Create a GCS bucket for Terraform state before init:

```bash
gsutil mb -l us-central1 gs://YOUR-GCS-STATE-BUCKET
gsutil versioning set on gs://YOUR-GCS-STATE-BUCKET
```

---

## Provision Flow — Hub + One Spoke

### Step 1 — Provision the hub

```bash
cd terraform/hub
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars: set project_id
terraform init -backend-config="bucket=YOUR-GCS-STATE-BUCKET" -backend-config="prefix=clusters/hub"
terraform apply
```

### Step 2 — Get hub kubeconfig

```bash
terraform output kubeconfig_command
# Run the printed gcloud command to write kubeconfig.
```

### Step 3 — Install platform on the hub

```bash
export KUBECONFIG=~/.kube/hub-config
bash platform/install.sh --env hub
```

Note: install.sh reads manifests from the pipeline-studio monorepo.
The script resolves the monorepo root 5 levels up.
Override with `PIPELINE_STUDIO_ROOT=/path/to/monorepo` if vendored elsewhere.

### Step 4 — Provision the dev spoke

```bash
cd terraform/dev
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars: set project_id
terraform init -backend-config="bucket=YOUR-GCS-STATE-BUCKET" -backend-config="prefix=clusters/dev"
terraform apply
```

### Step 5 — Install platform on the dev spoke

```bash
export KUBECONFIG=~/.kube/dev-config
bash platform/install.sh --env dev
```

### Step 6 — Register the spoke with the hub

```bash
export KUBECONFIG=~/.kube/hub-config
bash platform/register-spoke.sh \
  --spoke-kubeconfig ~/.kube/dev-config \
  --spoke-name dev \
  --environment dev
```

### Step 7 — Verify

```bash
export KUBECONFIG=~/.kube/dev-config
bash platform/verify.sh
# All non-optional checks must pass.
```

---

## Workload Identity Wiring

The GKE module creates GCP service accounts for ESO and ArgoCD.
Each GCP SA is bound to a Kubernetes SA via Workload Identity.

After `terraform apply`, annotate the K8s SA with the GCP SA email.

```bash
# ESO (every cluster):
ESO_SA=$(terraform output -raw eso_service_account_email)
kubectl annotate serviceaccount external-secrets \
  -n external-secrets-system \
  iam.gke.io/gcp-service-account="$ESO_SA" --overwrite

# ArgoCD (hub only):
ARGOCD_SA=$(terraform output -raw argocd_service_account_email)
kubectl annotate serviceaccount argocd-application-controller \
  -n argocd \
  iam.gke.io/gcp-service-account="$ARGOCD_SA" --overwrite
```

---

## Cluster Invariants

An invariant is a rule that must always hold on every cluster.
Each invariant has an enforce mechanism and a verify command.

If a verify command fails: the cluster is non-compliant. Fix before go-live.

---

### Invariant 1 — No container runs as root

Enforce: Kyverno `require-run-as-non-root` policy blocks root pods.
Mode: enforce on hub + prod. audit on dev + test.

Verify:
```bash
kubectl get clusterpolicy require-run-as-non-root \
  -o jsonpath='{.spec.validationFailureAction}'
# Expect: Enforce (prod/hub) or Audit (dev/test)
```

---

### Invariant 2 — Default-deny network policies on every workload namespace

Enforce: `default-deny-all` NetworkPolicy applied per namespace by install.sh.
Effect: all ingress + egress denied until an explicit allow rule is added.

Verify:
```bash
kubectl get networkpolicy default-deny-all -n prod
# Expect: the policy to exist. Repeat for dev, test, staging.
```

---

### Invariant 3 — Secrets come from GCP Secret Manager via ESO

Enforce: External Secrets Operator syncs from Secret Manager into K8s Secrets.
ESO authenticates via Workload Identity — no static key files in the cluster.

Verify:
```bash
kubectl get pods -n external-secrets-system | grep -c Running
# Expect: count greater than 0.
kubectl get serviceaccount external-secrets -n external-secrets-system \
  -o jsonpath='{.metadata.annotations.iam\.gke\.io/gcp-service-account}'
# Expect: the ESO GCP SA email — proves Workload Identity binding.
```

---

### Invariant 4 — TLS certificates are issued by cert-manager

Enforce: cert-manager installed by install.sh. Ingress objects request certs from it.
No manually managed certificates are allowed.

Verify:
```bash
kubectl get pods -n cert-manager | grep -c Running
# Expect: count greater than 0.
kubectl get clusterissuer
# Expect: at least one ClusterIssuer present.
```

---

### Invariant 5 — All deploys go through ArgoCD (GitOps only)

Enforce: ArgoCD on the hub is the only deploy path. Spokes have no ArgoCD.
Manual `kubectl apply` of services is banned.

Verify:
```bash
# On the hub:
kubectl get pods -n argocd | grep argocd-application-controller | grep Running
# Expect: the controller Running.
# On any spoke:
kubectl get pods -n argocd 2>/dev/null | grep -c argocd-server
# Expect: 0 — spokes must not run their own ArgoCD.
```

---

### Invariant 6 — Workload Identity is on; no node service account keys

Enforce: cluster created with `workload_identity_config`. Autopilot blocks key download.
Pods reach GCP APIs through their bound K8s SA only.

Verify:
```bash
gcloud container clusters describe pipeline-prod --region us-central1 \
  --format='value(workloadIdentityConfig.workloadPool)'
# Expect: <project>.svc.id.goog
```

---

### Invariant 7 — Clusters are private (nodes have no public IP)

Enforce: module sets `enable_private_nodes = true`.
Nodes are unreachable from the public internet.

Verify:
```bash
gcloud container clusters describe pipeline-prod --region us-central1 \
  --format='value(privateClusterConfig.enablePrivateNodes)'
# Expect: True
```

---

### Invariant 8 — Prod cannot be deleted by accident

Enforce: prod cluster has `deletion_protection = true` in the module.
A `terraform destroy` on prod fails until protection is removed deliberately.

Verify:
```bash
gcloud container clusters describe pipeline-prod --region us-central1 \
  --format='value(deletionProtection)'
# Expect: True
```

---

## Destroying a Cluster

⚠️ Destroys all cluster resources including persistent volumes.
⚠️ Confirm no live traffic before destroy.

```bash
cd terraform/dev   # or test, hub
terraform destroy
```

Prod has `deletion_protection = true`.
To destroy prod: set environment override off, apply, then destroy. Done deliberately.

---

## CI — .github/workflows/terraform.yml

Runs on pull request and push to main (paths: `terraform/**`).

| Job | Runs when | Needs GCP creds |
|---|---|---|
| validate | Always | No |
| plan | Only if `GCP_WORKLOAD_IDENTITY_PROVIDER` secret set | Yes |

validate does: `fmt -check`, `init -backend=false`, `validate` for module + each env.

plan does: authenticate via Workload Identity Federation, then `plan` per env.

When the GCP creds secret is missing: plan is skipped. The run does not fail.

Required secrets for plan:
- GCP_WORKLOAD_IDENTITY_PROVIDER
- GCP_TERRAFORM_SERVICE_ACCOUNT
- GCP_PROJECT_ID
- GCP_STATE_BUCKET
