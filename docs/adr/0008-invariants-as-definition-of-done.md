# ADR-0008 — Invariants as the definition of "done"

**Status:** Accepted
**Date:** 2026-06-17

## Context

"Claude says done" and "it builds" are not proof a service is secure or correct.
Different authors hold different bars across 106 repos.
The platform needs one objective, testable definition of done.

## Decision

A service or cluster is "done" only when every invariant that applies to its tier holds and has a passing test.

## Why

- INVARIANTS.md lists 23 server laws, 11 client laws (C-1…C-11), 4 mobile laws (M-1…M-4).
- Each invariant names the guarantee, what enforces it, and the test that checks it.
- Tier (A server, B SSR, C frontend, D mobile) decides which invariants apply.
- CI is the enforcer — lint, typecheck, test, scan, build must pass; nothing merges red (I-23).

## Alternatives rejected

- Subjective code review as the bar — varies by reviewer; not reproducible.
- A docs checklist with no tests — claims without proof; rots silently.
- Per-repo ad-hoc test suites — no shared law; gaps differ per repo.

## Consequences

- Easy: "is it done?" is a binary CI result, identical across every repo.
- Easy: a frontend reaches fellow-level via its BFF holding all 23 — no security gap.
- Harder: every invariant needs a real failing-then-passing test before merge.
- Trade-off accepted: more test surface up front in exchange for a uniform, provable bar.
