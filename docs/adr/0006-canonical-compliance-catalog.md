# ADR-0006 — Canonical compliance catalog, one COMPLIANCE_PROFILE flag

**Status:** Accepted
**Date:** 2026-06-17

## Context

The platform must serve ~30 compliance regimes across Canada, US, EU, and global.
Encoding each regime separately in each service produces drift and gaps.
A control added once must reach all services and the studio.

## Decision

Define one canonical control catalog in `catalog/compliance.yaml`; every regime flips the same keys, and one `COMPLIANCE_PROFILE` env selects the regime at runtime. Canada regimes come first.

## Why

- Uniform controls: every regime references the same key set (e.g. `audit_logging`, `data_residency`).
- One change in the catalog propagates to all 22 services plus the studio matrix view.
- `COMPLIANCE_PROFILE` flips a regime per service — verified by per-service compliance tests.
- Canada-first ordering: PIPEDA, Privacy Act, ITSG-33, Law 25 lead the catalog.

## Alternatives rejected

- Per-service hand-coded compliance — drifts; a control gets fixed in one service, missed in others.
- A separate config schema per regime — no uniform keys; the studio cannot build one matrix.
- A code branch per regime — unmaintainable across 22 services × 30 regimes.

## Consequences

- Easy: switching a service from PIPEDA to HIPAA is one env value.
- Easy: the studio renders one matrix from the single catalog.
- Harder: every new control must declare its type, default, and device scope in one place.
- Trade-off accepted: the catalog is a shared bottleneck all changes route through.
