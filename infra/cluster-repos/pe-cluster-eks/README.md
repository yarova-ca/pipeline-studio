# pe-cluster-eks

**What this covers:** Standalone Terraform + platform scripts to run Pipeline Studio on AWS EKS.

**When to read:** Before provisioning the hub cluster or registering an EKS spoke.

---

## What This Repo Is

Self-contained EKS-only cluster repo.

No GKE. No AKS. No OpenShift. No `var.cloud` switch.

Each env workspace calls the local EKS module directly at `../modules/eks`.

---

## Directory Structure

```
pe-cluster-eks/
├── terraform/
│   ├── modules/
│   │   └── eks/              VPC + EKS cluster + node group + IRSA (ESO, ArgoCD)
│   ├── hub/                  Hub cluster (ArgoCD + management tools only)
│   ├── dev/                  Dev spoke (1 replica, audit Kyverno)
│   ├── test/                 Test spoke (2 replicas, prod-like limits)
│   └── prod/                 Prod spoke (3+ replicas, strict Kyverno, HA NAT)
├── platform/
│   ├── install.sh           Installs cert-manager, ingress, Kyverno, ArgoCD, ESO, etc.
│   ├── register-spoke.sh    Registers a spoke with hub ArgoCD + creates ApplicationSet
│   └── verify.sh            Health check — all non-optional checks must pass
├── .github/workflows/
│   └── terraform.yml        fmt + init + validate (always) + plan (gated on AWS creds)
└── README.md                This file
```

---

## Hub-and-Spoke Design for EKS

One hub cluster runs ArgoCD.

Three spoke clusters run the workloads: dev, test, prod.

ArgoCD never runs on a spoke. The hub is the only deploy path to every spoke.

**Why a dedicated hub:**
When a spoke cluster is overloaded, the hub stays available.
Management and deploys keep working during a spoke incident.

**Per-cluster sizing:**

| Cluster | Node type | Min | Desired | Max | NAT |
|---|---|---|---|---|---|
| hub | t3.medium | 2 | 2 | 4 | single |
| dev | t3.large | 2 | 3 | 5 | single |
| test | m5.xlarge | 3 | 5 | 10 | single |
| prod | m5.2xlarge | 5 | 10 | 50 | HA (one per AZ) |

Each cluster gets its own VPC, EKS control plane, node group, and IRSA roles.

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| terraform | >= 1.6 (tested 1.14.5) | provision clusters |
| aws CLI | v2 | auth + kubeconfig |
| kubectl | >= 1.28 | apply platform manifests |
| helm | >= 3.14 | install platform charts |
| argocd CLI | >= 2.10 | register spokes |

AWS IAM permissions required: EKS, VPC, EC2, IAM (for IRSA roles).

---

## Provision the Hub

**Step 1 — create the state bucket:**

```bash
aws s3 mb s3://YOUR-TF-STATE-BUCKET --region us-east-1
aws s3api put-bucket-versioning \
  --bucket YOUR-TF-STATE-BUCKET \
  --versioning-configuration Status=Enabled
```

**Step 2 — apply the hub workspace:**

```bash
cd terraform/hub
cp terraform.tfvars.example terraform.tfvars   # edit region if needed
terraform init \
  -backend-config="bucket=YOUR-TF-STATE-BUCKET" \
  -backend-config="key=clusters/hub/terraform.tfstate" \
  -backend-config="region=us-east-1"
terraform apply
```

**Step 3 — get the hub kubeconfig:**

```bash
terraform output -raw kubeconfig_command   # prints the aws eks update-kubeconfig command
$(terraform output -raw kubeconfig_command)
```

**Step 4 — install the platform on the hub:**

```bash
export KUBECONFIG=~/.kube/config
bash ../../platform/install.sh --env hub --cloud eks
```

ArgoCD installs on the hub during this step.

---

## Register a Spoke

**Step 1 — provision the spoke (example: dev):**

```bash
cd terraform/dev
terraform init \
  -backend-config="bucket=YOUR-TF-STATE-BUCKET" \
  -backend-config="key=clusters/dev/terraform.tfstate" \
  -backend-config="region=us-east-1"
terraform apply
```

**Step 2 — get the spoke kubeconfig into its own file:**

```bash
aws eks update-kubeconfig --name pipeline-dev --region us-east-1 \
  --kubeconfig ~/.kube/dev-config
```

**Step 3 — install the platform on the spoke (no ArgoCD on spokes):**

```bash
KUBECONFIG=~/.kube/dev-config bash ../../platform/install.sh --env dev --cloud eks
```

**Step 4 — register the spoke with the hub ArgoCD:**

```bash
export KUBECONFIG=~/.kube/hub-config   # must point to the hub
bash ../../platform/register-spoke.sh \
  --spoke-kubeconfig ~/.kube/dev-config \
  --spoke-name dev \
  --environment dev
```

This adds the spoke to ArgoCD and creates the `pipeline-dev` ApplicationSet.

**Step 5 — verify the spoke:**

```bash
KUBECONFIG=~/.kube/dev-config bash ../../platform/verify.sh
```

Repeat steps 1–5 for `test` and `prod`.

---

## IRSA Roles Created Per Cluster

IRSA: IAM Roles for Service Accounts — pods assume an IAM role with no static keys.

| Role | Bound ServiceAccount | Grants | Why |
|---|---|---|---|
| `<cluster>-eso` | `external-secrets-system:external-secrets` | Secrets Manager + SSM read | ESO syncs cluster secrets from AWS |
| `<cluster>-argocd` | `argocd:argocd-application-controller` | ECR read-only | ArgoCD reconciles image-based apps |

After `terraform apply`, annotate the ServiceAccounts with the output role ARNs:

```bash
terraform output eso_irsa_role_arn
terraform output argocd_irsa_role_arn
```

---

## CLUSTER INVARIANTS

Laws every cluster must hold.

Each invariant: how it is enforced, and how `platform/verify.sh` checks it.

| # | Invariant | Enforced by | Verified by |
|---|---|---|---|
| 1 | Pods run as non-root, no privilege escalation | Kyverno policy + Pod Security Admission `restricted` label on namespaces | `verify.sh` checks Kyverno pods Running + `pod.security` label on prod namespace |
| 2 | Network is default-deny; only declared traffic flows | `NetworkPolicy default-deny-all` applied per namespace by `install.sh` step 7 | `verify.sh` checks `NetworkPolicy default-deny-all` exists in prod |
| 3 | Secrets come from AWS via ESO, never plaintext in git | External Secrets Operator + `<cluster>-eso` IRSA role reading Secrets Manager / SSM | `verify.sh` checks ESO controller Running |
| 4 | All ingress TLS is automated, no manual certs | cert-manager (`install.sh` step 4) issues + renews certificates | `verify.sh` checks cert-manager pods Running |
| 5 | ArgoCD is the only deploy path; no manual kubectl apply of workloads | ArgoCD runs on hub only; spokes registered + driven by ApplicationSets | `verify.sh` checks ArgoCD server Running on hub |
| 6 | Prod admission policies are enforce, not audit | `install.sh` step 6 applies Kyverno policies in `enforce` mode only when `--env prod` | `verify.sh` checks Kyverno pods Running (policy mode set at install) |
| 7 | Every running image is CVE-scanned continuously | Trivy Operator (`install.sh` step 19) scans running workloads | `verify.sh` checks Trivy Operator Running (optional) |
| 8 | Runtime attacks are detected at the kernel level | Falco DaemonSet (`install.sh` step 15) watches syscalls via eBPF | `verify.sh` checks Falco DaemonSet ready |
| 9 | Every namespace has a resource quota; no unbounded consumption | `namespace-quotas.yaml` applied by `install.sh` step 1 | `verify.sh` checks `ResourceQuota` exists in prod |
| 10 | Cluster state is backed up daily and restorable | Velero (`install.sh` step 16) + daily backup schedule | `verify.sh` checks Velero Running + backup schedule exists (optional) |

**Running the full check:**

```bash
KUBECONFIG=~/.kube/<cluster>-config bash platform/verify.sh
```

Exit 0: all non-optional checks passed, cluster is production-ready.
Exit 1: at least one non-optional check failed; fix before go-live.

---

## CI — `.github/workflows/terraform.yml`

| Job | Runs | Needs AWS creds |
|---|---|---|
| fmt check | `terraform fmt -check -recursive terraform` | No |
| validate | `init -backend=false` + `validate` per module + env | No |
| plan | `init` + `terraform plan` per env | Yes — gated on `secrets.AWS_ROLE_ARN` |

The plan job checks for `AWS_ROLE_ARN` first.

When the secret is set: AWS OIDC role assumed, plan runs.
When the secret is missing: plan steps skip with a notice, no hard fail.

Optional secrets for plan: `AWS_REGION` (defaults to `us-east-1`), `TF_STATE_BUCKET`.

---

## Destroying a Cluster

Destroys all cluster resources including persistent volumes.

Run `terraform destroy` only after confirming no live traffic.

```bash
cd terraform/dev   # or test, prod, hub
terraform destroy
```
