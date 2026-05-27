# Pipeline Stage Types

## Phase 0 — Bootstrap

| Stage | Type |
|---|---|
| Branch protection | DevOps |
| CODEOWNERS | DevOps |
| OIDC trust | DevSecOps |
| Registry access | DevOps |
| Kyverno admission policy | DevSecOps |
| Dependency update automation | DevSecOps |

## Phase 1 — Local Dev

| Stage | Type |
|---|---|
| IDE plugins | DevOps |
| Pre-commit hooks | DevSecOps |
| Local secret scan | DevSecOps |

## Phase 2 — PR Gate

| Stage | Type |
|---|---|
| Pre-commit (CI) | DevSecOps |
| SCA | DevSecOps |
| SAST | DevSecOps |
| License scan | DevSecOps |
| IaC scan | DevSecOps |
| Secrets scan | DevSecOps |
| Build (no push) | DevOps |
| SBOM generate | DevSecOps |
| Container scan | DevSecOps |
| PR review | DevOps |

## Phase 3 — Main Build

| Stage | Type |
|---|---|
| Pre-commit (CI) | DevSecOps |
| SCA | DevSecOps |
| SAST | DevSecOps |
| License scan | DevSecOps |
| IaC scan | DevSecOps |
| Secrets scan | DevSecOps |
| Build + Push | DevOps |
| Release tag | DevOps |
| SBOM generate + attest | DevSecOps |
| Container scan | DevSecOps |
| Sign | DevSecOps |
| Tests + Codecov | DevOps |
| DAST | DevSecOps |
| Perf test | DevOps |
| SLSA provenance | DevSecOps |
| Notify | DevOps |

## Registry

| Stage | Type |
|---|---|
| Image store | DevOps |
| Sign verify | DevSecOps |
| SBOM attach | DevSecOps |
| SLSA attach | DevSecOps |

## Promotions — DEV / TEST / STAGING

| Stage | Type |
|---|---|
| GitOps PR | DevOps |
| ArgoCD/Flux deploy | DevOps |
| cosign verify | DevSecOps |
| Env tests | DevOps |
| Gate | DevOps |

## Promotions — PROD only

Stages 4 and 5 are replaced.
Env tests → Argo Rollouts (canary traffic shift).
Gate → Monitor (complete or rollback).

| Stage | Type | Replaces |
|---|---|---|
| Argo Rollouts | DevOps | Env tests |
| Monitor | DevOps | Gate |

---

DevOps stages: 16
DevSecOps stages: 28
Total stages: 44
