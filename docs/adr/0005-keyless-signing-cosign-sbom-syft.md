# ADR-0005 — Keyless image signing (cosign) + SBOM (Syft)

**Status:** Accepted
**Date:** 2026-06-17

## Context

Regulated buyers require supply-chain proof: who built an image and what is in it.
Long-lived signing keys leak and must be rotated and guarded.
Invariant I-20 requires every build to be reproducible and attested.

## Decision

Sign every image with cosign keyless (OIDC identity) and attach a Syft-generated SBOM at build time.

## Why

- Keyless cosign uses the CI OIDC identity — no signing key to store, leak, or rotate.
- Syft SBOM lists every package in the image — answers "what is in it" for auditors.
- `04-build-push-sign.yml` runs both steps in CI per service.
- The compliance catalog defaults `image_signing` and `sbom_required` to on for everyone.

## Alternatives rejected

- Long-lived cosign key pair — a secret to manage and a single point of compromise.
- No signing — fails I-20 and regulated supply-chain requirements (OSFI B-10, ISO 27017).
- SBOM only on demand — auditors need it attached to the artifact, not regenerated later.

## Consequences

- Easy: any consumer verifies provenance against the CI OIDC identity with no shared secret.
- Easy: SBOM ships with every image; supply-chain questions answer from the artifact.
- Harder: verification depends on the OIDC issuer and a transparency log being reachable.
- Trade-off accepted: a dependency on the keyless trust root over self-managed keys.
