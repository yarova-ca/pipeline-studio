# pe-cluster-aks

**What this covers:** Standalone Terraform + platform scripts to run Pipeline Studio on Azure AKS.

**When to read:** Before provisioning an AKS hub or spoke, or before changing a cluster invariant.

---

## What this repo is

This repo provisions Pipeline Studio clusters on Azure AKS only.

No EKS. No GKE. No OpenShift.
No `var.cloud` switch — every env calls the AKS module directly.

Provider: `hashicorp/azurerm ~> 4.0`.
Terraform: `>= 1.6` (validated on 1.14.5).

---

## Hub-and-spoke model

One hub cluster runs ArgoCD and management tools.
Three spoke clusters run the 105 services: dev, test, prod.

The hub never runs user services.
Why: when a spoke is overloaded, the hub stays available to manage it.

ArgoCD on the hub deploys to every spoke.
Spokes never run their own ArgoCD.

| Cluster | Runs | Node SKU | Min/Max nodes |
|---|---|---|---|
| hub | ArgoCD + Backstage only | Standard_D2s_v3 | 2 / 4 |
| dev | 105 services, 1 replica | Standard_D4s_v3 | 2 / 5 |
| test | 105 services, 2 replicas | Standard_D4s_v3 | 3 / 10 |
| prod | 105 services, 3+ replicas | Standard_D8s_v3 | 5 / 50 |

---

## Directory structure

```
pe-cluster-aks/
├── terraform/
│   ├── modules/aks/     AKS cluster: VMSS + Managed Identity + OIDC issuer
│   ├── hub/             Hub workspace (ArgoCD host)
│   ├── dev/             Dev spoke workspace
│   ├── test/            Test spoke workspace
│   └── prod/            Prod spoke workspace
├── platform/
│   ├── install.sh       Installs cert-manager, ingress, Kyverno, ArgoCD, ESO, etc.
│   ├── register-spoke.sh Registers a spoke with hub ArgoCD + creates ApplicationSet
│   └── verify.sh        Health check — all must pass before go-live
├── .github/workflows/
│   └── terraform.yml    fmt + init + validate (always); plan (only with Azure creds)
└── README.md            This file
```

---

## What the AKS module creates

| Resource | Purpose |
|---|---|
| `azurerm_resource_group` | Holds all cluster resources. |
| `azurerm_kubernetes_cluster` | The AKS control plane + system node pool. |
| Default node pool (VMSS) | Autoscaling nodes via Virtual Machine Scale Sets. |
| SystemAssigned identity | Managed Identity — no service principal secrets to rotate. |
| OIDC issuer + Workload Identity | Lets pods federate to Azure AD (ESO uses this). |
| Key Vault secrets provider | CSI driver that mounts secrets from Azure Key Vault. |
| Calico network policy | Enforces Kubernetes NetworkPolicy (default-deny invariant). |

Module outputs: `oidc_issuer_url`, `kubelet_identity_object_id`, `kube_config`, `kubeconfig_command`.

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Terraform | >= 1.6 | Provision clusters. |
| az CLI | latest | Auth + get kubeconfig. |
| kubectl | >= 1.28 | Talk to clusters. |
| helm | >= 3.14 | Install platform components. |
| argocd CLI | >= 2.10 | Register spokes with the hub. |

Azure side: a subscription with the AKS and VNet resource providers registered.

---

## State backend

Each workspace uses an `azurerm` backend.
Create one storage account + container, key per workspace.

```bash
az group create --name pipeline-tfstate-rg --location eastus
az storage account create \
  --name pipelinetfstate --resource-group pipeline-tfstate-rg \
  --sku Standard_LRS --encryption-services blob
az storage container create \
  --name tfstate --account-name pipelinetfstate
```

| Workspace | State key |
|---|---|
| hub | `clusters/hub.tfstate` |
| dev | `clusters/dev.tfstate` |
| test | `clusters/test.tfstate` |
| prod | `clusters/prod.tfstate` |

---

## Provision flow — hub first, then a spoke

### Step 1: Authenticate to Azure

```bash
az login
export ARM_SUBSCRIPTION_ID="<your-subscription-id>"
```

### Step 2: Provision the hub

```bash
cd terraform/hub
terraform init \
  -backend-config="resource_group_name=pipeline-tfstate-rg" \
  -backend-config="storage_account_name=pipelinetfstate" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=clusters/hub.tfstate"
terraform apply
```

### Step 3: Get hub kubeconfig

```bash
terraform output -raw kubeconfig_command | bash
# e.g. az aks get-credentials --resource-group pipeline-hub-rg --name pipeline-hub
```

### Step 4: Install platform on the hub

```bash
export KUBECONFIG=~/.kube/config
export PIPELINE_STUDIO_ROOT=/path/to/pipeline-studio  # holds infra/ manifests
bash platform/install.sh --env hub
```

### Step 5: Provision the dev spoke

```bash
cd terraform/dev
terraform init \
  -backend-config="resource_group_name=pipeline-tfstate-rg" \
  -backend-config="storage_account_name=pipelinetfstate" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=clusters/dev.tfstate"
terraform apply
```

### Step 6: Install platform on the dev spoke

```bash
export KUBECONFIG=~/.kube/dev-config
bash platform/install.sh --env dev
```

---

## Register-spoke flow

The spoke exists but the hub does not yet manage it.
`register-spoke.sh` adds the spoke to hub ArgoCD and creates its ApplicationSet.

Run it with KUBECONFIG pointed at the hub.

```bash
export KUBECONFIG=~/.kube/hub-config
bash platform/register-spoke.sh \
  --spoke-kubeconfig ~/.kube/dev-config \
  --spoke-name dev \
  --environment dev
```

After this: ArgoCD on the hub syncs services to the dev spoke automatically.

Verify the spoke:

```bash
export KUBECONFIG=~/.kube/dev-config
bash platform/verify.sh
```

---

## Cluster invariants

Each invariant is enforced on the cluster and has a one-command verify.
A cluster is not production-ready until every verify passes.

---

### Invariant 1 — No container runs as root

Enforce: Kyverno `ClusterPolicy` rejects pods with `runAsNonRoot: false` or unset.

Mode by env:
- dev/test: `validationFailureAction: audit` — violations logged, not blocked.
- prod: `validationFailureAction: enforce` — violations blocked at admission.

Verify:
```bash
kubectl get clusterpolicy require-run-as-non-root -o jsonpath='{.spec.validationFailureAction}'
```

When output is `Enforce` (prod): a root pod is rejected at admission.
When output is `Audit` (dev/test): a root pod is admitted but a PolicyReport entry is created.

---

### Invariant 2 — Default-deny network policies

Enforce: every app namespace has a `default-deny-all` NetworkPolicy.
Calico is the policy engine (set in the AKS module `network_policy = "calico"`).

Allow rules are added per service on top of the deny baseline.

Verify:
```bash
kubectl get networkpolicy default-deny-all -n prod
```

When the policy exists: traffic with no explicit allow rule is dropped.
When the policy is missing: the namespace fails verification — re-run platform install.

---

### Invariant 3 — Secrets come from External Secrets Operator only

Enforce: ESO syncs secrets from Azure Key Vault via Workload Identity.
Pods federate using the cluster OIDC issuer (module output `oidc_issuer_url`).

No raw `kind: Secret` is committed to Git.

Verify:
```bash
kubectl get pods -n external-secrets-system | grep -E 'Running'
kubectl get clustersecretstore azure-kv -o jsonpath='{.status.conditions[0].status}'
```

When ESO pods are Running and the store status is `True`: secrets sync from Key Vault.
When ESO is down: existing synced secrets stay; new ExternalSecret objects do not resolve.

---

### Invariant 4 — TLS certificates are issued by cert-manager

Enforce: cert-manager runs a `ClusterIssuer`; Ingress objects request certs via annotation.
No manually uploaded certificates.

Verify:
```bash
kubectl get clusterissuer letsencrypt-prod -o jsonpath='{.status.conditions[0].status}'
```

When status is `True`: Ingress hosts get auto-issued, auto-renewed TLS certs.
When status is not `True`: new Ingress hosts serve no valid cert — check the issuer.

---

### Invariant 5 — Deploys happen through ArgoCD only

Enforce: ArgoCD on the hub owns every workload in the spokes.
Drift is reverted by ArgoCD `selfHeal: true`.

No human runs `kubectl apply` for service workloads.

Verify:
```bash
kubectl get application -n argocd -o jsonpath='{.items[*].spec.syncPolicy.automated.selfHeal}'
```

When every value is `true`: manual edits to managed resources are reverted automatically.
When a value is missing or `false`: manual drift persists — fix the Application syncPolicy.

---

### Invariant 6 — Cluster identity uses Managed Identity, never static keys

Enforce: the AKS module sets `identity { type = "SystemAssigned" }`.
No service principal client secret is stored anywhere.

Verify:
```bash
az aks show -g pipeline-prod-rg -n pipeline-prod \
  --query "identity.type" -o tsv
```

When output is `SystemAssigned`: the control plane uses a rotating managed identity.
When output is `ServicePrincipal`: a static secret exists — reprovision with the module.

---

### Invariant 7 — OIDC issuer + Workload Identity stay enabled

Enforce: the module sets `oidc_issuer_enabled = true` and `workload_identity_enabled = true`.
ESO and other pods federate against this issuer — disabling it breaks secret sync.

Verify:
```bash
az aks show -g pipeline-prod-rg -n pipeline-prod \
  --query "oidcIssuerProfile.enabled" -o tsv
```

When output is `true`: pods can federate to Azure AD for Key Vault access.
When output is `false`: ESO Workload Identity fails — re-apply the module.

---

### Invariant 8 — Nodes run on autoscaling VMSS

Enforce: the module sets the default node pool `type = "VirtualMachineScaleSets"` with autoscaling on.

Verify:
```bash
az aks nodepool show -g pipeline-prod-rg --cluster-name pipeline-prod -n system \
  --query "{type:type, autoscale:enableAutoScaling}" -o json
```

When `type` is `VirtualMachineScaleSets` and `autoscale` is `true`: nodes scale with load.
When autoscale is `false`: node count is fixed — re-apply the module to restore autoscaling.

---

## Terraform CI/CD

Workflow: `.github/workflows/terraform.yml`.

Always runs (no credentials needed):
- `terraform fmt -check -recursive`
- `terraform init -backend=false` per workspace
- `terraform validate` for the module and each env

Runs only when Azure creds exist:
- `terraform plan` per env.

The plan job is gated two ways:
- Repo variable `RUN_PLAN` must be `true`.
- Secret `AZURE_CLIENT_ID` must be set.

When `AZURE_CLIENT_ID` is absent: the plan step prints a skip message and exits 0.
When `AZURE_CLIENT_ID` is present: `azure/login` runs with OIDC, then `terraform plan` runs.

No hard-fail on missing credentials.

Required for plan:
- Secrets: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`.
- Variables: `RUN_PLAN`, `TFSTATE_RG`, `TFSTATE_SA`, `TFSTATE_CONTAINER`.

---

## Destroying a cluster

⚠️ Destroys all cluster resources including persistent volumes.
⚠️ Run only after confirming no live traffic.

```bash
cd terraform/dev   # or test, prod, hub
terraform destroy
```

Prod requires removing the GitHub environment protection rule first.
