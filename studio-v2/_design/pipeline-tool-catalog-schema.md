# Pipeline Tool Catalog Schema

## Structure

Phase → stages within it → tool table for each stage.

---

## Columns — every stage tool table

| Column | What it captures |
|---|---|
| Tool | Name + version |
| License | Open source / commercial |
| Applies to | All / specific language / web only / mobile only |
| Changes when | Config changes based on: stack / compliance standard |
| Output format | SARIF / JSON / HTML / N/A |
| CI integration | Native action / Docker image / CLI / N/A |
| Mandatory | Yes / No |
| When to use | Specific condition |
| When NOT | Specific condition |
| Primary tradeoff | vs closest alternative, one line |

---

## Phase 0 — Bootstrap

### Branch protection
### CODEOWNERS
### OIDC trust
### Registry access
### Kyverno admission policy
### Dependency update automation

---

## Phase 1 — Local Dev

### IDE plugins
### Pre-commit hooks
### Local secret scan

---

## Phase 2 — PR Gate

### Pre-commit (CI)
### SCA
### SAST
### License scan
### IaC scan
### Secrets scan
### Build (no push)
### SBOM generate
### Container scan
### PR review

---

## Phase 3 — Main Build

### Pre-commit (CI)
### SCA
### SAST
### License scan
### IaC scan
### Secrets scan
### Build + Push
### Release tag
### SBOM generate + attest
### Container scan
### Sign
### Tests + Codecov
### DAST
### Perf test
### SLSA provenance
### Notify

---

## Registry

### Image store
### Sign verify
### SBOM attach
### SLSA attach

---

## Promotions

Same 5 stages apply to DEV / TEST / STAGING.
PROD replaces stages 4–5: Argo Rollouts + Monitor instead of Env tests + Gate.

### GitOps PR
### ArgoCD/Flux deploy
### cosign verify
### Env tests
### Gate
