# ADR-0009 — Ship both Helm and Kustomize per service

**Status:** Accepted
**Date:** 2026-06-17

## Context

Teams are split on Kubernetes packaging: some standardize on Helm, some on Kustomize.
Forcing one tool blocks adoption by teams committed to the other.
Each service must deploy on whichever the consuming team already uses.

## Decision

Ship both a Helm chart and a Kustomize overlay set in every service repo; the deploying team picks one.

## Why

- `services/<name>/helm/` and `services/<name>/kustomize/` both exist and both deploy the service.
- A Helm-standard team uses the chart; a Kustomize-standard team uses the overlays.
- ArgoCD supports both natively as application sources — no tool lock-in at the platform.
- Neither tool is privileged; the choice is made at deploy time, not at build time.

## Alternatives rejected

- Helm only — blocks teams whose GitOps standard is Kustomize.
- Kustomize only — blocks teams whose package registry and tooling are Helm.
- A custom packaging tool — one more thing to learn; no ecosystem.

## Consequences

- Easy: a team deploys with the tool it already runs — zero migration.
- Easy: ArgoCD points at either path with no platform change.
- Harder: two deploy definitions per service must stay in sync.
- Trade-off accepted: duplicate manifests to maintain in exchange for universal adoption.
