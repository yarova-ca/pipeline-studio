# ADR-0001 — Golden repos: one real repo per framework

**Status:** Accepted
**Date:** 2026-06-17

## Context

The platform must ship working code for 106 frameworks, not advice.
A code generator emits unverified output that nobody has built or run.
Developers need a repo they can clone, build, and deploy today.

## Decision

Ship one real, runnable golden repo per framework under `services/<name>/`, hand-written and verified — not generated on demand.

## Why

- Each repo is verified locally: build green, container builds, runs, `/health` answers.
- A real repo can hold all 23 invariants with a passing test for each.
- A developer clones it, writes app code, sets URLs/keys — nothing else.
- Generated code cannot be proven correct; a committed repo can.

## Alternatives rejected

- Code generator / scaffolding CLI — output is never built or verified; quality drifts per run.
- A single mono-framework starter — does not cover 106 stacks or their tier differences.
- Docs-only guidance — leaves the hard 90% (CI, deploy, security) unwritten.

## Consequences

- Easy: every shipped framework is a proven artifact with real output behind it.
- Easy: NestJS is the gold standard; other repos copy its exact law.
- Harder: 106 repos must be built and maintained by hand; ~84 still show "platform team yet to build."
- Trade-off accepted: slower coverage in exchange for code that actually runs.
