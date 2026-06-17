# ADR-0003 — Hub-and-spoke cluster topology

**Status:** Accepted
**Date:** 2026-06-17

## Context

The platform runs dev, test, and prod environments, possibly across clouds.
Running ArgoCD inside every environment multiplies control planes and blast radius.
One management plane must drive many workload clusters.

## Decision

Use a hub-and-spoke topology: a hub cluster runs ArgoCD and management tools; dev, test, and prod are spokes that run only workloads.

## Why

- One ArgoCD on the hub manages every spoke — single pane, single source of truth.
- Spokes hold no control plane; the hub registers them and creates an ApplicationSet.
- Per-spoke policy differs by env: dev/test Kyverno audit, prod Kyverno enforce.
- `register-spoke.sh` wires a spoke to the hub; `verify.sh` runs a 10-check go-live gate.

## Alternatives rejected

- ArgoCD per environment — N control planes to patch, secure, and reconcile.
- A single shared cluster with namespaces — no real prod isolation; one failure domain.
- Push-based CI deploy with no GitOps controller — loses drift detection and self-heal.

## Consequences

- Easy: add a new spoke by provisioning it and registering with the hub.
- Easy: prod gets strict isolation (3+ replicas, HA NAT, enforce mode).
- Harder: the hub is a critical dependency; if the hub is down, no syncs run.
- Trade-off accepted: one central management cluster to protect, in exchange for uniform control.
