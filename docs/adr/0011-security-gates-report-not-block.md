# ADR-0011 — Security gates report-not-block in the template

**Status:** Accepted
**Date:** 2026-06-17

## Context

A golden repo is a starting template, cloned into many different risk contexts.
A hard-blocking scan on first clone stops a developer before they ship anything.
Different consumers carry different CVE and policy tolerances.

## Decision

Ship security scans as report-not-block in the template; consumers tighten them to blocking for prod.

## Why

- `02-security-gates.yml` runs scans with `continue-on-error: true` — findings report, do not block.
- A fresh clone builds and runs so the developer reaches a working state immediately.
- Comments in the workflows show how to flip Trivy to `--exit-code 1` for blocking (e.g. PCI DSS).
- The consumer owns the prod risk decision; the template ships visibility, not a hard wall.

## Alternatives rejected

- Block on every finding by default — first clone fails before any app code exists; adoption dies.
- No scans at all — invariant I-21 (no high/critical CVE) has nothing to enforce.
- Block in template, document how to relax — wrong default; safe-but-unusable out of the box.

## Consequences

- Easy: a cloned repo builds and runs day one, with findings visible.
- Easy: a prod consumer flips one flag to make CVEs blocking.
- Harder: an inattentive team could ship to prod with gates still in report mode.
- Trade-off accepted: a usable default over a safe-by-force default; prod hardening is the consumer's step.
