# ADR-0004 — GitOps with ArgoCD as the only deploy path

**Status:** Accepted
**Date:** 2026-06-17

## Context

Deploys done by hand or by ad-hoc CI `kubectl apply` drift from what is in Git.
Auditors and operators need one answer to "what is running, and why."
The hub already runs ArgoCD as the single management plane.

## Decision

Make ArgoCD the only path that changes a cluster; Git is the sole source of desired state.

## Why

- Desired state lives in Git; ArgoCD reconciles and self-heals drift.
- Every change is a reviewable, revertable commit — full audit trail.
- CI builds, signs, and pushes images; it never deploys directly.
- Prod adds a GitHub environment gate for manual approval before the merge that triggers sync.

## Alternatives rejected

- CI `kubectl apply` / `helm upgrade` from pipelines — no drift detection; cluster diverges from Git.
- Manual `kubectl` by operators — unauditable; no single source of truth.
- Flux instead of ArgoCD — viable, but ArgoCD is already the installed hub controller.

## Consequences

- Easy: rollback is a git revert; the cluster state is always reconstructable from Git.
- Easy: access to clusters narrows — humans change Git, not the cluster.
- Harder: every change must go through Git even for urgent fixes.
- Trade-off accepted: no out-of-band hotfix; speed traded for auditability.
