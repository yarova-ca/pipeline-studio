# Architecture Decision Records (ADRs)

**What this covers:** the core platform decisions for Yarova Pipeline Studio — context, decision, why, rejected alternatives, consequences.

**When to read:** before changing platform structure, naming, deploy flow, compliance, or security defaults.

---

## What an ADR is

An ADR captures ONE decision.
It records why the decision was made and what was rejected.
It is immutable once Accepted — to change a decision, add a new ADR that supersedes it.

---

## The format

Every ADR follows the same template:

```
# ADR-NNNN — <title>
**Status:** Accepted
**Date:** YYYY-MM-DD

## Context
## Decision
## Why
## Alternatives rejected
## Consequences
```

---

## Index

| ADR | Title | Decision in one line |
|---|---|---|
| [0001](0001-golden-repos-per-framework.md) | Golden repos per framework | Ship one real, verified repo per framework — not a generator. |
| [0002](0002-repo-naming-convention.md) | Repo naming convention | Name repos `pe-<category>-<framework>` and `pe-cluster-<cloud>`. |
| [0003](0003-hub-and-spoke-cluster-topology.md) | Hub-and-spoke topology | Hub runs ArgoCD; dev/test/prod are workload-only spokes. |
| [0004](0004-gitops-argocd-only-deploy-path.md) | GitOps, ArgoCD only | ArgoCD is the only path that changes a cluster; Git is source of truth. |
| [0005](0005-keyless-signing-cosign-sbom-syft.md) | Keyless signing + SBOM | Sign images with cosign keyless; attach a Syft SBOM at build. |
| [0006](0006-canonical-compliance-catalog.md) | Canonical compliance catalog | One control catalog; `COMPLIANCE_PROFILE` flips a regime; Canada first. |
| [0007](0007-per-device-compliance.md) | Per-device compliance | A control applies only to the device types it declares. |
| [0008](0008-invariants-as-definition-of-done.md) | Invariants as "done" | Done = every applicable invariant holds with a passing test. |
| [0009](0009-ship-both-helm-and-kustomize.md) | Helm and Kustomize | Ship both per service; the deploying team picks one. |
| [0010](0010-multi-cloud-terraform-modules.md) | Multi-cloud Terraform | One module per cloud (EKS/AKS/GKE/OpenShift) behind one interface. |
| [0011](0011-security-gates-report-not-block.md) | Security gates report-not-block | Template scans report; consumers tighten to blocking for prod. |
| [0012](0012-studio-is-a-knowledge-guide.md) | Studio is a knowledge guide | The studio teaches and links to real repos; it never generates code. |

---

## Adding a new ADR

1. Copy the format above into `NNNN-title.md` with the next number.
2. Capture exactly one decision.
3. Set `Status: Accepted` and today's date.
4. Add a row to the index table above.
