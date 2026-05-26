# Pipeline Schema

```
PHASE 0 — Bootstrap (runs once, not per PR)
├── Branch protection — no direct push to main
├── CODEOWNERS — auto-assign reviewers by path
├── OIDC trust — CI talks to cloud, no stored passwords
├── Registry access — push scoped to exact repo + branch
├── Kyverno admission policy — cluster rejects unsigned images
└── Dependency update automation — Renovate / Dependabot configured
         │
         ▼
PHASE 1 — Local Dev (developer machine)
├── IDE plugins — linters, formatters
├── Pre-commit hooks — gitleaks, hadolint, checkov
└── Local secret scan
         │
         ▼
PHASE 2 — PR Gate (triggers on every PR push)
├── Pre-commit (CI)
├── ┌──────────────────────────────────┐
│   │ SCA │ SAST │ License │ IaC │ Secrets │  ← all parallel
│   └──────────────────────────────────┘
├── Build (no push) — tarball only
├── SBOM generate
├── Container scan (Trivy on tarball)
└── PR review — human must approve
         │
         ▼ merge to main
PHASE 3 — Main Build (triggers on merge)
├── Pre-commit (CI)
├── ┌──────────────────────────────────┐
│   │ SCA │ SAST │ License │ IaC │ Secrets │  ← all parallel
│   └──────────────────────────────────┘
├── Build + Push to registry
├── Release tag — semantic version applied to image
├── SBOM generate + attest
├── Container scan (Trivy on registry image)
├── Sign — cosign keyless OIDC
├── Tests + Codecov
├── DAST — ZAP against local running container
├── Perf test — k6
├── SLSA provenance Level 3
└── Notify — Slack
         │
         ▼
REGISTRY
├── Image store
├── Sign verify
├── SBOM attach
└── SLSA attach
         │
         ▼
PROMOTIONS (each env is the same 5 steps)
│
├── DEV
│   ├── GitOps PR — bump image digest in dev overlay
│   ├── ArgoCD/Flux deploy
│   ├── cosign verify — re-check signature
│   ├── Smoke test
│   └── Gate ──▶
│
├── TEST
│   ├── GitOps PR — bump image digest in test overlay
│   ├── ArgoCD/Flux deploy
│   ├── cosign verify
│   ├── Integration tests
│   └── Gate ──▶
│
├── STAGING
│   ├── GitOps PR — bump image digest in staging overlay
│   ├── ArgoCD/Flux deploy
│   ├── cosign verify
│   ├── Regression tests
│   └── Gate ──▶
│
└── PROD
    ├── GitOps PR — bump image digest in prod overlay
    ├── ArgoCD/Flux deploy
    ├── cosign verify
    ├── Argo Rollouts — canary traffic shift
    └── Monitor → complete or rollback
```
