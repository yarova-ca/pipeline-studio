# ADR-0010 — Multi-cloud via Terraform modules behind one interface

**Status:** Accepted
**Date:** 2026-06-17

## Context

Buyers run on AWS, GCP, Azure, and on-prem OpenShift.
Hand-written per-cloud cluster setup diverges and is unportable.
The same dev/test/prod shape must provision on any supported cloud.

## Decision

Provision clusters with Terraform modules (EKS, AKS, GKE, OpenShift) behind one workspace interface, selected by a `cloud` variable.

## Why

- One module per cloud lives under `infra/clusters/terraform/modules/`.
- A spoke workspace runs `terraform apply -var="cloud=eks"` (or gke, aks, openshift).
- The hub/dev/test/prod workspaces are cloud-agnostic; the module hides cloud specifics.
- Each cloud module bakes in workload identity: IRSA (EKS), Workload Identity (GKE), Managed Identity (AKS).

## Alternatives rejected

- Per-cloud bespoke scripts — no shared interface; each cloud drifts independently.
- A single-cloud lock-in (EKS only) — excludes GCP, Azure, and on-prem buyers.
- A higher abstraction (Crossplane/Pulumi) — new tool and runtime; Terraform is already the standard here.

## Consequences

- Easy: switch a spoke's cloud by changing one variable, same workspace shape.
- Easy: GKE Autopilot recommended for the hub — zero node management.
- Harder: four cloud modules must each track upstream provider and cloud API changes.
- Trade-off accepted: maintaining four modules in exchange for true cloud portability.
