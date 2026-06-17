# ADR-0012 — The studio is a knowledge guide, not a code generator

**Status:** Accepted
**Date:** 2026-06-17

## Context

Users need to understand the platform and choose a stack across 106 frameworks.
A generator that emits code produces unverified output and hides the reasoning.
The real, verified code already lives in the golden repos.

## Decision

Build the studio (`app/`) as a knowledge guide that teaches and links to real repos — it never generates code.

## Why

- The studio covers all 106 frameworks: knowledge, guidance, the per-industry recipe.
- Two ways in: Express (2 plain questions) or Custom (full control) — both explain every choice.
- It reads `catalog/` and links to the real `services/` repos and the compliance matrix.
- A framework with no golden repo shows "platform team yet to build" — honest, not fabricated.

## Alternatives rejected

- A code generator in the studio — emits unverified code; contradicts ADR-0001's real-repos rule.
- A wizard that copies a repo and rewrites it — re-introduces unverified mutation.
- Docs site with no decision flow — does not help a user choose a stack for their industry.

## Consequences

- Easy: every link points to code that was actually built, run, and verified.
- Easy: the studio teaches the "why" behind each choice, not just the "what."
- Harder: the studio cannot offer a one-click new project for unbuilt frameworks.
- Trade-off accepted: guidance over generation; coverage gated on real repos existing.
