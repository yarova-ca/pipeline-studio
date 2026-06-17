# ADR-0002 — Repo naming: pe-<category>-<framework> and pe-cluster-<cloud>

**Status:** Accepted
**Date:** 2026-06-17

## Context

The platform spans 106 service repos plus per-cloud cluster repos.
Without a fixed naming law, repos are unfindable and tooling cannot match them.
The studio, ArgoCD, and CI all need a predictable name to resolve a repo.

## Decision

Name every service repo `pe-<category>-<framework>` and every cluster repo `pe-cluster-<cloud>`.

## Why

- `pe-` prefix groups all platform-engineering repos under one sortable namespace.
- `<category>` (api, web, edge, mobile, protocol) maps directly to the invariant tier.
- `<framework>` is unique and human-readable: `pe-api-nestjs`, `pe-web-nextjs`.
- Cluster repos already follow it: `pe-cluster-eks`, `pe-cluster-aks`, `pe-cluster-gke`, `pe-cluster-openshift`.

## Alternatives rejected

- Free-form names — unsearchable; no machine mapping from framework to repo.
- Framework-only names (`nestjs`) — collides with upstream names; no category signal.
- One monorepo for everything — loses per-repo ownership, CI scope, and clone-and-go.

## Consequences

- Easy: studio and ArgoCD derive a repo name from a chosen framework deterministically.
- Easy: cluster repos are obvious by cloud; one repo per cloud target.
- Harder: renaming a framework or category means renaming its repo.
- Trade-off accepted: a rigid scheme over naming freedom.
