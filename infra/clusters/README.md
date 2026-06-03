# Cluster Infrastructure

**What this covers:** Terraform modules and platform scripts for all Pipeline Studio clusters.

**When to read:** Before provisioning a new cluster or running platform install.

---

## Directory Structure

```
infra/clusters/
├── terraform/
│   ├── modules/
│   │   ├── eks/          EKS (AWS) — VPC + cluster + managed node group + IRSA
│   │   ├── gke/          GKE (GCP) — Autopilot + Workload Identity
│   │   ├── aks/          AKS (Azure) — VMSS + Managed Identity + OIDC
│   │   └── openshift/    OpenShift — wraps openshift-install CLI
│   ├── hub/              Hub cluster (ArgoCD + management tools only)
│   ├── dev/              Dev spoke (1 replica, audit Kyverno, spot nodes)
│   ├── test/             Test spoke (2 replicas, prod-like limits)
│   └── prod/             Prod spoke (3+ replicas, strict Kyverno, HA)
├── platform/
│   ├── install.sh        Installs cert-manager, ingress, Kyverno, ArgoCD, ESO, Prometheus
│   ├── register-spoke.sh Registers a spoke with hub ArgoCD + creates ApplicationSet
│   └── verify.sh         10-command health check (all must pass before go-live)
└── README.md             This file
```

---

## Prerequisites

### All clouds

| Tool | Version | Install |
|---|---|---|
| Terraform | >= 1.6 | `brew install terraform` or tfenv |
| kubectl | >= 1.28 | `brew install kubectl` |
| helm | >= 3.14 | `brew install helm` |
| argocd CLI | >= 2.10 | `brew install argocd` |

### Per cloud

| Cloud | Extra prerequisites |
|---|---|
| EKS (AWS) | `aws` CLI v2, IAM permissions for EKS + VPC + EC2 |
| GKE (GCP) | `gcloud` CLI, `google-cloud-sdk`, project with container API enabled |
| AKS (Azure) | `az` CLI, subscription with AKS + VNet resource provider registered |
| OpenShift | `openshift-install` binary from mirror.openshift.com, Red Hat pull secret |

---

## Quick Start — Hub + Dev Spoke

### Step 1: State backend

Create an S3 bucket (or GCS bucket) for Terraform state before running init.

```bash
# AWS
aws s3 mb s3://YOUR-TERRAFORM-STATE-BUCKET --region us-east-1
aws s3api put-bucket-versioning \
  --bucket YOUR-TERRAFORM-STATE-BUCKET \
  --versioning-configuration Status=Enabled
```

### Step 2: Provision hub cluster

**GKE (recommended — zero node management):**

```bash
cd infra/clusters/terraform/hub
cp terraform.tfvars.gke.example terraform.tfvars
# Edit terraform.tfvars: set gke_project_id to your GCP project
terraform init \
  -backend-config="bucket=YOUR-TERRAFORM-STATE-BUCKET" \
  -backend-config="prefix=clusters/hub"
terraform plan
terraform apply
```

**EKS alternative:**

```bash
cd infra/clusters/terraform/hub
cp terraform.tfvars.eks.example terraform.tfvars
# Edit terraform.tfvars: set region
terraform init \
  -backend-config="bucket=YOUR-TERRAFORM-STATE-BUCKET" \
  -backend-config="key=clusters/hub/terraform.tfstate" \
  -backend-config="region=us-east-1"
terraform plan
terraform apply
```

### Step 3: Get kubeconfig for hub

Terraform outputs the exact command to run:

```bash
terraform output kubeconfig_command
# Run the output command, e.g.:
# gcloud container clusters get-credentials pipeline-hub --region us-central1 --project YOUR_PROJECT
```

### Step 4: Install platform on hub

```bash
export KUBECONFIG=~/.kube/config  # or path to hub kubeconfig
bash infra/clusters/platform/install.sh --env hub
```

### Step 5: Provision dev spoke

```bash
cd infra/clusters/terraform/dev
terraform init \
  -backend-config="bucket=YOUR-TERRAFORM-STATE-BUCKET" \
  -backend-config="key=clusters/dev/terraform.tfstate" \
  -backend-config="region=us-east-1"
terraform apply -var="cloud=eks"   # or gke, aks
```

### Step 6: Install platform on dev spoke

```bash
export KUBECONFIG=~/.kube/dev-config
bash infra/clusters/platform/install.sh --env dev
```

### Step 7: Register dev spoke with hub

```bash
export KUBECONFIG=~/.kube/hub-config   # must point to hub
bash infra/clusters/platform/register-spoke.sh \
  --spoke-kubeconfig ~/.kube/dev-config \
  --spoke-name dev \
  --environment dev
```

### Step 8: Verify

```bash
export KUBECONFIG=~/.kube/dev-config
bash infra/clusters/platform/verify.sh
# All 10 checks must pass
```

---

## Environment Differences

| Setting | dev | test | prod |
|---|---|---|---|
| Replicas per service | 1 | 2 | 3+ |
| Kyverno mode | audit | audit | enforce |
| Node size (EKS) | t3.large | m5.xlarge | m5.2xlarge |
| Node size (AKS) | Standard_D4s_v3 | Standard_D4s_v3 | Standard_D8s_v3 |
| Max nodes | 5 | 10 | 50 |
| NAT gateway | Single | Single | HA (multi-AZ) |
| Resource limits | Minimal | Production-like | Strict |
| ArgoCD | Hub only | Hub only | Hub only |
| Manual approval required | No | No | Yes (GitHub env gate) |

---

## State Backend Setup

Each cluster workspace has its own state file.
Configure per workspace in `terraform init -backend-config`.

| Cluster | S3 key example |
|---|---|
| hub | `clusters/hub/terraform.tfstate` |
| dev | `clusters/dev/terraform.tfstate` |
| test | `clusters/test/terraform.tfstate` |
| prod | `clusters/prod/terraform.tfstate` |

GCS backend (for GKE-only setups):

```bash
terraform init \
  -backend-config="bucket=YOUR-GCS-BUCKET" \
  -backend-config="prefix=clusters/hub"
```

---

## Destroying a Cluster

⚠️ Destroys all cluster resources including persistent volumes.
⚠️ Run `terraform destroy` only after confirming no live traffic.

```bash
cd infra/clusters/terraform/dev   # or test, prod, hub
terraform destroy
```

Prod requires removing the GitHub environment protection rule first.

---

## Cost Estimates

Estimates are approximate. Actual cost depends on region, data transfer, and utilisation.

### EKS (AWS, us-east-1)

| Cluster | Node type | Count | Est. monthly |
|---|---|---|---|
| hub | t3.medium × 2 | 2 | ~$70 |
| dev | t3.large × 3 | 3 | ~$180 |
| test | m5.xlarge × 5 | 5 | ~$730 |
| prod | m5.2xlarge × 10 | 10 | ~$2,940 |

EKS control plane: $0.10/hr per cluster = ~$73/month per cluster.

### GKE Autopilot (GCP, us-central1)

Autopilot charges per pod resource request, not per node.

| Cluster | Idle cost | At 105 services × 0.1 CPU / 128MB |
|---|---|---|
| hub | ~$30/month | N/A — ArgoCD only |
| dev | ~$50/month | ~$120/month |
| test | ~$80/month | ~$220/month |
| prod | ~$100/month | ~$450/month |

### AKS (Azure, eastus)

| Cluster | Node type | Count | Est. monthly |
|---|---|---|---|
| hub | — | — | Control plane free |
| dev | Standard_D4s_v3 × 2 | 2 | ~$280 |
| test | Standard_D4s_v3 × 3 | 3 | ~$420 |
| prod | Standard_D8s_v3 × 5 | 5 | ~$1,400 |

---

## Terraform CI/CD

The `.github/workflows/terraform.yml` workflow:

On pull request (paths: `infra/clusters/terraform/**`):
- Detects which cluster workspaces changed.
- Runs `terraform plan` per changed workspace.
- Posts plan output as a PR comment.

On merge to main:
- Runs `terraform apply` per changed workspace.
- Prod workspace requires manual approval via GitHub Environments.

Required GitHub secret: `AWS_TERRAFORM_ROLE_ARN` (OIDC role ARN).

To use static keys instead, replace the `configure-aws-credentials` step with:

```yaml
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```
