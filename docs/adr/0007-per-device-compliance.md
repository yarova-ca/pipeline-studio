# ADR-0007 — Per-device compliance scoping

**Status:** Accepted
**Date:** 2026-06-17

## Context

Controls are not meaningful on every kind of service.
`encryption_at_rest` needs a datastore; a static frontend has none.
Applying every control everywhere produces false failures and noise.

## Decision

Every control declares `applies_to` device types; a control applies to a service only when its device type matches.

## Why

- Device types are fixed: backend, web-ssr, web-static, edge, mobile-app, mobile-bff, protocol.
- `encryption_at_rest` applies only to backend, web-ssr, mobile-bff — the ones with a datastore.
- `accessibility_wcag` applies only to UI devices: web-ssr, web-static, mobile-app.
- A service is scored against the controls valid for its device type, not all controls.

## Alternatives rejected

- Apply every control to every service — false negatives on controls that make no sense there.
- Manual per-service control lists — drifts from the catalog; duplicates the catalog's intent.
- Skip scoping, document exceptions in prose — unauditable and easy to forget.

## Consequences

- Easy: a static frontend is never failed for lacking a database control.
- Easy: the studio filters the visible controls by the chosen device type.
- Harder: every new control must correctly enumerate its `applies_to` set.
- Trade-off accepted: more metadata per control in exchange for accurate, device-correct scoring.
