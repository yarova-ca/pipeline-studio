# Pipeline Invariants

## What this covers
Conditions that must ALWAYS hold true at every phase and stage.
Violation = pipeline broken — build must stop or never reach the next stage.

## When to read
When adding a new stage, changing stage order, or evaluating a compliance gap.

---

## Columns

| Column | What it captures |
|---|---|
| ID | Unique invariant identifier |
| Stage | Phase and stage where enforced |
| Invariant | The condition that must always hold |
| If violated | What breaks downstream |
| Enforced by | Tool or mechanism that enforces it |
| Control class | Security / Compliance / Process |

---

## Phase 0 — Bootstrap

| ID | Stage | Invariant | If violated | Enforced by | Control class |
|---|---|---|---|---|---|
| I-P0-1 | Branch protection | No direct push to main ever | Unreviewed code ships | GitHub branch protection rules | Process |
| I-P0-2 | OIDC trust | CI uses OIDC tokens — no long-lived secrets stored in CI | Credential leak if repo compromised | GitHub OIDC + cloud IAM | Security |
| I-P0-3 | Registry access | Push scoped to exact repo + branch only | Any branch can push any image | Registry policy + OIDC role binding | Security |
| I-P0-4 | Kyverno admission policy | Cluster rejects any image not signed by the pipeline | Unsigned images run in production | Kyverno ClusterPolicy | Security |
| I-P0-5 | Dependency update automation | All dependency updates arrive as PRs — never manual edits | Drift accumulates silently | Renovate / Dependabot config | Process |

---

## Phase 1 — Local Dev

| ID | Stage | Invariant | If violated | Enforced by | Control class |
|---|---|---|---|---|---|
| I-P1-1 | Local secret scan | A commit containing a detected secret is blocked before it leaves the developer machine | Secret reaches remote, requires rotation | gitleaks pre-commit hook | Security |
| I-P1-2 | Pre-commit hooks | Dockerfile linting (hadolint) and IaC checks (checkov) block commit on failure | Bad Dockerfile or IaC ships to PR | pre-commit framework + hadolint + checkov | Process |

---

## Phase 2 — PR Gate

| ID | Stage | Invariant | If violated | Enforced by | Control class |
|---|---|---|---|---|---|
| I-P2-1 | Build (no push) | Image is built to tarball only — no push to registry ever | Unscanned image in registry | Docker build with `--output type=tar` or no `--push` | Security |
| I-P2-2 | SCA / SAST / License / IaC / Secrets | All five scans complete before build step begins | Build promotes code that fails a scan | CI job ordering — scans in parallel, build depends on all five | Security |
| I-P2-3 | Container scan | Trivy scans the tarball — not a registry image | A pushed image is scanned; PR gate is bypassed | Trivy `--input tarball.tar` | Security |
| I-P2-4 | PR review | At least one human approval required before merge | No human review of code changes | GitHub branch protection — required reviewers | Process |
| I-P2-5 | SBOM generate | SBOM is generated from the same tarball scanned by Trivy | SBOM and scan diverge — different artifact | SBOM tool points at the same tarball | Compliance |

---

## Phase 3 — Main Build

| ID | Stage | Invariant | If violated | Enforced by | Control class |
|---|---|---|---|---|---|
| I-P3-1 | Sign | Image is signed only after it is pushed and scanned — never before | Signature covers unscanned image | CI job ordering — sign depends on container scan | Security |
| I-P3-2 | SBOM generate + attest | SBOM attestation is attached only after signing — never before | Attestation has no verified image to anchor to | CI job ordering — attest depends on sign | Compliance |
| I-P3-3 | Container scan | Trivy scans the registry image digest — not a tarball or tag | Scan and deployed image diverge | Trivy `--image registry/repo@sha256:...` | Security |
| I-P3-4 | SLSA provenance | SLSA provenance is generated only after image is signed | Provenance anchors to an unsigned image | CI job ordering — SLSA depends on sign | Compliance |
| I-P3-5 | Release tag | Semantic version tag applied before SBOM and SLSA generation | SBOM and SLSA reference untagged digest | CI job ordering — tag before attest and provenance | Process |
| I-P3-6 | Tests + Codecov | All tests pass before DAST runs | DAST runs against a broken application | CI job ordering — DAST depends on test success | Process |

---

## Registry

| ID | Stage | Invariant | If violated | Enforced by | Control class |
|---|---|---|---|---|---|
| I-R-1 | Sign verify | No image is promoted from registry to any environment without cosign signature verification | Unsigned image runs in environment | cosign verify at registry promotion step | Security |
| I-R-2 | SBOM attach | SBOM is attached to the registry image before any promotion | Environment has no SBOM for the running image | OCI SBOM attach step before promotion gate | Compliance |
| I-R-3 | SLSA attach | SLSA provenance is attached to the registry image before any promotion | Supply chain attestation missing in environment | OCI SLSA attach step before promotion gate | Compliance |

---

## Promotions — all 4 environments (DEV / TEST / STAGING / PROD)

| ID | Stage | Invariant | If violated | Enforced by | Control class |
|---|---|---|---|---|---|
| I-PR-1 | cosign verify | Signature verified in the target environment before ArgoCD/Flux deploys | Deployment of unverified image | cosign verify step in promotion workflow | Security |
| I-PR-2 | GitOps PR | Deployment references image by digest — never by mutable tag | Tag re-tag swaps running image silently | GitOps PR sets `image: repo@sha256:...` | Security |
| I-PR-3 | Gate | Promotion to the next environment requires explicit gate approval | Any environment auto-promotes on test pass | Manual approval gate or policy gate in ArgoCD | Process |
| I-PR-4 | Env tests | Tests must pass before gate opens — gate cannot open on partial test results | Broken build promotes through environments | CI gate condition — all test steps green | Process |

---

## Summary counts

| Phase | Invariants | Security | Compliance | Process |
|---|---|---|---|---|
| Phase 0 — Bootstrap | 5 | 3 | 0 | 2 |
| Phase 1 — Local Dev | 2 | 1 | 0 | 1 |
| Phase 2 — PR Gate | 5 | 3 | 1 | 1 |
| Phase 3 — Main Build | 6 | 2 | 2 | 2 |
| Registry | 3 | 1 | 2 | 0 |
| Promotions | 4 | 2 | 0 | 2 |
| **Total** | **25** | **12** | **5** | **8** |
