---
name: "[12 Native Android] Java Android SDK 17 — pipeline setup"
about: "Pipeline setup for Java Android SDK 17 (12 Native Android). Covers Phase 0–3, all 6 registries, DEV→PROD promotions, and all 11 compliance standards."
labels: pipeline-setup
assignees: ''
---

**Category:** 12 Native Android
**Pattern:** CI-only
**Language:** Android native
**Runtime image:** `N/A (CI-only — APK/AAB)`
**FIPS runtime:** `N/A (no FIPS variant)`
**Build image:** `ubuntu:24.04`
**Port:** None
**Compliance:** FIPS 140-2/3 | PCI DSS | HIPAA | FedRAMP | CMMC | SOC 2 | SOX | GDPR | PIPEDA | NERC CIP | ISO 27001

---
## Phase 0 — Repo Bootstrap (once per repo)

| Stage | Type | Action |
|---|---|---|
| Branch protection | DevOps | Protect main; require PR; enforce status checks; no direct push |
| CODEOWNERS | DevOps | `echo "* @your-team" > .github/CODEOWNERS` |
| OIDC trust | DevSecOps | `permissions: id-token: write` in all CI workflows; no stored cloud credentials |
| Registry access | DevOps | Scope push to exact repo + branch only; pull from all |
| Kyverno policy | DevSecOps | Block unsigned/unscanned images cluster-wide; enforce runAsNonRoot |
| Dependency update automation | DevSecOps | Renovate: add `renovate.json` OR Dependabot: `.github/dependabot.yml` — weekly updates, auto-merge patch |
| Secret baseline | DevSecOps | `gitleaks detect --no-git . --report-path baseline.json` |

---
## Phase 1 — Local Dev (on git commit)

**IDE setup:** Android Studio + Lint + Detekt

**Pre-commit hooks** (all active in `.pre-commit-config.yaml`):

| Hook | What it catches |
|---|---|
| hadolint | Dockerfile best practices and shell issues in RUN |
| gitleaks | Secrets in staged files before commit |
| trufflehog | Verified secrets via entropy + pattern matching |

Install: `pre-commit install && pre-commit run --all-files`

**Local secret scan** (pick one):

| Tool | Command |
|---|---|
| gitleaks | `gitleaks detect --source=. --no-banner` |
| trufflehog | `trufflehog git file://. --only-verified` |


**Local SCA — dependency audit** (pick one):

| Tool | Command |
|---|---|
| OWASP Dependency-Check | `dependency-check --scan . --format JSON` |
| osv-scanner | `osv-scanner --lockfile gradle.lockfile` |
| snyk | `snyk test --severity-threshold=high` |


**Local SAST** (pick one):

| Tool | Command |
|---|---|
| semgrep | `semgrep --config=auto .` |
| detekt | `./gradlew detekt` |
| CodeQL | `uses: github/codeql-action/analyze@v3  # languages: java-kotlin` |


---
## Phase 2 — PR Gate (every PR push)

All security stages run in parallel after `pre-commit` passes.

**Pre-commit (CI):**
`pre-commit run --all-files`

**SCA ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| OWASP Dependency-Check | `dependency-check --scan . --format JSON` |
| osv-scanner | `osv-scanner --lockfile gradle.lockfile` |
| snyk | `snyk test --severity-threshold=high` |


**SAST ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| semgrep | `semgrep --config=auto .` |
| detekt | `./gradlew detekt` |
| CodeQL | `uses: github/codeql-action/analyze@v3  # languages: java-kotlin` |


**License scan ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| license-gradle-plugin | `./gradlew checkLicense` |
| FOSSA | `fossa analyze && fossa test` |


**IaC scan ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| checkov | `checkov -d . --quiet --soft-fail` |
| KICS | `kics scan -p . -o results.json` |
| Trivy config | `trivy config . --exit-code 0` |

**Secrets scan ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| trufflehog | `trufflehog git --only-verified .` |
| gitleaks | `gitleaks detect --source=. --report-path=gitleaks.json` |
| GitGuardian | `ggshield secret scan repo .` |

**Build (no container):**
`./gradlew assembleRelease  # or bundleRelease for AAB`

**PR review:**
Human approval — CODEOWNERS enforced

---
## Phase 3 — Main Build (on merge to main)

**Pre-commit (CI):**
`pre-commit run --all-files`

**SCA ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| OWASP Dependency-Check | `dependency-check --scan . --format JSON` |
| osv-scanner | `osv-scanner --lockfile gradle.lockfile` |
| snyk | `snyk test --severity-threshold=high` |


**SAST ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| semgrep | `semgrep --config=auto .` |
| detekt | `./gradlew detekt` |
| CodeQL | `uses: github/codeql-action/analyze@v3  # languages: java-kotlin` |


**License scan ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| license-gradle-plugin | `./gradlew checkLicense` |
| FOSSA | `fossa analyze && fossa test` |


**Secrets scan ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| trufflehog | `trufflehog git --only-verified .` |
| gitleaks | `gitleaks detect --source=. --report-path=gitleaks.json` |


**App build (APK / AAB):**
`./gradlew assembleRelease  # or bundleRelease for AAB`


**Tests + Codecov:**
`./gradlew test && codecov`

**Release tag:**
`semantic-release --no-ci` — applies semver tag to source

**Notify:**
`uses: slackapi/slack-github-action@v1  # post job status to #deployments channel`

---
## Compliance Deltas

| Standard | Phase 2 delta | Phase 3 delta |
|---|---|---|
| PCI DSS 4.0 | Fail on any CRITICAL CVE in source dependencies | Zero CRITICAL vulnerabilities before release |
| HIPAA | Scan source for PHI patterns; fail on match | Enforce secure storage; sign artifacts |
| FedRAMP | SLSA Level 3 source attestation | All deps vendored; FIPS-compatible build environment |
| CMMC 2.0 Level 2 | Named reviewers only for CUI-touching PRs | Full audit trail; retain artifacts 3 years |
| SOC 2 Type II | Save all scan results as CI artifacts | Retain logs and scan results per pipeline run |
| SOX | Separate-team reviewer required (4-eyes) | Change management ticket required before merge |
| GDPR | Scan source for hardcoded PII; fail on match | Document data processing purpose in release metadata |
| PIPEDA / Quebec Law 25 | Scan for Canadian PII (SIN, postal codes) | Document data processing purpose in release metadata |
| ISO 27001 | Risk-based scan thresholds documented per asset class | Retain all artifacts 3–5 years |

---
## Checklist

- [ ] Phase 0 complete (branch protection, OIDC, Renovate/Dependabot)
- [ ] Phase 1 hooks installed and passing locally
- [ ] Phase 2 gate passing — all parallel stages green (SAST, license, IaC, secrets)
- [ ] Phase 3 app build clean — APK / AAB produced
- [ ] Release tag applied (semver)
- [ ] Tests passing + Codecov coverage uploaded
- [ ] Compliance deltas applied for all applicable standards
