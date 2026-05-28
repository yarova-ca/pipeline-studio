---
name: "[27 C/C++] Crow 1.3.2 — pipeline setup"
about: "Pipeline setup for Crow 1.3.2 (27 C/C++). Covers Phase 0–3, all 6 registries, DEV→PROD promotions, and all 11 compliance standards."
labels: pipeline-setup
assignees: ''
---

**Category:** 27 C/C++
**Pattern:** Multi-stage
**Language:** C/C++
**Runtime image:** `scratch (static) or debian:12-slim (dynamic)`
**FIPS runtime:** `registry.access.redhat.com/ubi9/ubi-micro`
**Build image:** `ubuntu:24.04`
**Port:** 8080
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

**IDE setup:** clangd + CMake Tools + VS Code

**Dockerfile lint** (pick one):

| Tool | Command |
|---|---|
| hadolint | `hadolint Dockerfile` |
| checkov | `checkov -d . --framework dockerfile` |


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
| vcpkg-audit | `vcpkg audit  # or conan inspect` |
| osv-scanner | `osv-scanner --lockfile conan.lock` |
| snyk | `snyk test --severity-threshold=high` |


**Local SAST** (pick one):

| Tool | Command |
|---|---|
| cppcheck | `cppcheck --enable=all --xml . 2> cppcheck.xml` |
| clang-tidy | `clang-tidy -p build src/**/*.cpp` |
| semgrep | `semgrep --config=auto .` |
| CodeQL | `uses: github/codeql-action/analyze@v3  # languages: cpp` |


---
## Phase 2 — PR Gate (every PR push)

All security stages run in parallel after `pre-commit` passes.

**Pre-commit (CI):**
`pre-commit run --all-files`

**SCA ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| vcpkg-audit | `vcpkg audit  # or conan inspect` |
| osv-scanner | `osv-scanner --lockfile conan.lock` |
| snyk | `snyk test --severity-threshold=high` |


**SAST ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| cppcheck | `cppcheck --enable=all --xml . 2> cppcheck.xml` |
| clang-tidy | `clang-tidy -p build src/**/*.cpp` |
| semgrep | `semgrep --config=auto .` |
| CodeQL | `uses: github/codeql-action/analyze@v3  # languages: cpp` |


**License scan ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| licensecheck | `licensecheck -r .` |
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

**Build (no push):**
`docker build --platform linux/amd64 --target runtime -t app:pr-${{ github.sha }} --load .`

**SBOM generate (PR-stage):**
`syft packages docker:app:pr-$SHA -o spdx-json > sbom-pr.json`

**Container scan ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| trivy | `trivy image --exit-code 1 --severity HIGH,CRITICAL app:pr-$SHA` |
| grype | `grype app:pr-$SHA --fail-on high` |
| snyk container | `snyk container test app:pr-$SHA --severity-threshold=high` |
| docker scout | `docker scout cves app:pr-$SHA` |

**PR review:**
Human approval — CODEOWNERS enforced; minimum 1 reviewer from a separate team

---
## Phase 3 — Main Build (on merge to main)

**Pre-commit (CI):**
`pre-commit run --all-files`

**SCA ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| vcpkg-audit | `vcpkg audit  # or conan inspect` |
| osv-scanner | `osv-scanner --lockfile conan.lock` |
| snyk | `snyk test --severity-threshold=high` |


**SAST ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| cppcheck | `cppcheck --enable=all --xml . 2> cppcheck.xml` |
| clang-tidy | `clang-tidy -p build src/**/*.cpp` |
| semgrep | `semgrep --config=auto .` |
| CodeQL | `uses: github/codeql-action/analyze@v3  # languages: cpp` |


**License scan ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| licensecheck | `licensecheck -r .` |
| FOSSA | `fossa analyze && fossa test` |


**IaC scan ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| checkov | `checkov -d . --quiet` |
| KICS | `kics scan -p . -o results.json` |

**Secrets scan ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| trufflehog | `trufflehog git --only-verified .` |
| gitleaks | `gitleaks detect --source=. --report-path=gitleaks.json` |


**App build** (pick one):

| Tool | Command |
|---|---|
| cmake | `cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build` |


**Container build + push:**

| Target | Command |
|---|---|
| standard | `docker buildx build --platform linux/amd64 --push --target runtime -t $REGISTRY/$IMAGE:$SHA .` |
| FIPS | `docker buildx build --platform linux/amd64 --push --target runtime-fips -t $REGISTRY/$IMAGE:$SHA-fips .` |

**Release tag:**
`semantic-release --no-ci` — applies semver tag; also retags image as `$VERSION`

**Container scan — registry image (post-push)** (pick one):

| Tool | Command |
|---|---|
| trivy | `trivy image --exit-code 1 --severity HIGH,CRITICAL $REGISTRY/$IMAGE:$SHA` |
| grype | `grype $REGISTRY/$IMAGE:$SHA --fail-on high` |
| snyk container | `snyk container test $REGISTRY/$IMAGE:$SHA --severity-threshold=high` |
| docker scout | `docker scout cves $REGISTRY/$IMAGE:$SHA` |

**Sign:**
`cosign sign --yes $REGISTRY/$IMAGE@$DIGEST`

**SBOM generate + attest:**
`syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json`
Attest: `syft packages $IMAGE@$DIGEST -o spdx-json | cosign attest --yes --predicate - $REGISTRY/$IMAGE@$DIGEST`

**SLSA provenance (Level 3):**
`uses: slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v2`


**Tests + Codecov:**
`cd build && ctest --output-on-failure && codecov`

**DAST** (pick one):

| Tool | Command |
|---|---|
| OWASP ZAP | `zap-baseline.py -t http://localhost:8080` |
| Nuclei | `nuclei -u http://localhost:8080 -severity medium,high,critical` |
| Burp Suite API | `burp-rest-api --burp-headless -u http://localhost:8080` |

**Perf test** (pick one):

| Tool | Command |
|---|---|
| k6 | `k6 run perf/smoke.js` |
| Gatling | `gatling.sh -sf src/gatling -s BasicSimulation` |
| Artillery | `artillery run perf/smoke.yml` |

**Notify:**
`uses: slackapi/slack-github-action@v1  # post job status to #deployments channel`

---
## Registry — All 6

**Standard push (`--target runtime`):**

| Registry | Auth method | Command |
|---|---|---|
| AWS ECR | OIDC | `docker buildx build --platform linux/amd64 --push --target runtime -t $ECR_REGISTRY/$REPO:$SHA .` |
| GCP Artifact Registry | Workload Identity | `docker buildx build --platform linux/amd64 --push --target runtime -t $REGION-docker.pkg.dev/$PROJECT/$REPO:$SHA .` |
| Azure ACR | Federated Credentials | `docker buildx build --platform linux/amd64 --push --target runtime -t $ACR_REGISTRY/$IMAGE:$SHA .` |
| GitHub GHCR | GITHUB_TOKEN | `docker buildx build --platform linux/amd64 --push --target runtime -t ghcr.io/$GITHUB_REPOSITORY:$SHA .` |
| Red Hat Quay | Robot account | `docker buildx build --platform linux/amd64 --push --target runtime -t quay.io/$ORG/$REPO:$SHA .` |
| Docker Hub | Service account token | `docker buildx build --platform linux/amd64 --push --target runtime -t docker.io/myorg/myapp:$SHA .` |

**FIPS push (`--target runtime-fips`):**

| Registry | Auth method | Command |
|---|---|---|
| AWS ECR | OIDC | `docker buildx build --platform linux/amd64 --push --target runtime-fips -t $ECR_REGISTRY/$REPO:$SHA-fips .` |
| GCP Artifact Registry | Workload Identity | `docker buildx build --platform linux/amd64 --push --target runtime-fips -t $REGION-docker.pkg.dev/$PROJECT/$REPO:$SHA-fips .` |
| Azure ACR | Federated Credentials | `docker buildx build --platform linux/amd64 --push --target runtime-fips -t $ACR_REGISTRY/$IMAGE:$SHA-fips .` |
| GitHub GHCR | GITHUB_TOKEN | `docker buildx build --platform linux/amd64 --push --target runtime-fips -t ghcr.io/$GITHUB_REPOSITORY:$SHA-fips .` |
| Red Hat Quay | Robot account | `docker buildx build --platform linux/amd64 --push --target runtime-fips -t quay.io/$ORG/$REPO:$SHA-fips .` |
| Docker Hub | Service account token | `docker buildx build --platform linux/amd64 --push --target runtime-fips -t docker.io/myorg/myapp:$SHA-fips .` |

**Sign verify:**
`cosign verify --certificate-identity=$GITHUB_ACTION_URL --certificate-oidc-issuer=https://token.actions.githubusercontent.com $IMAGE@$DIGEST`

**SBOM attach:**
`oras attach --artifact-type application/vnd.cyclonedx $IMAGE@$DIGEST sbom.spdx.json`

**SLSA attach:**
Attached automatically by `slsa-github-generator` output

---
## Promotions — DEV → TEST → STAGING → PROD

| Env | Stage | Action |
|---|---|---|
| DEV | GitOps PR | Bump image digest in `dev/kustomization.yaml` |
| DEV | Deploy | ArgoCD / Flux sync from dev overlay; wait for rollout |
| DEV | cosign verify | `cosign verify --certificate-identity=$ID $IMAGE@$DIGEST` |
| DEV | Integration tests | Run integration test suite against deployed service |
| DEV | Gate | Required approvers in GitHub environment settings |
| TEST | GitOps PR | Bump image digest in `test/kustomization.yaml` |
| TEST | Deploy | ArgoCD / Flux sync from test overlay |
| TEST | cosign verify | `cosign verify --certificate-identity=$ID $IMAGE@$DIGEST` |
| TEST | Integration + contract tests | `pact verify` + integration test suite |
| TEST | Gate | Required approvers before staging promotion |
| STAGING | GitOps PR | Bump image digest in `staging/kustomization.yaml` |
| STAGING | Deploy | ArgoCD / Flux sync from staging overlay |
| STAGING | cosign verify | `cosign verify --certificate-identity=$ID $IMAGE@$DIGEST` |
| STAGING | Regression tests | Run full regression test suite |
| STAGING | Gate | Required approvers before production promotion |
| PROD | GitOps PR | Bump image digest in `prod/kustomization.yaml` |
| PROD | Deploy | ArgoCD / Flux sync from prod overlay |
| PROD | cosign verify | `cosign verify --certificate-identity=$ID $IMAGE@$DIGEST` |
| PROD | Canary | Argo Rollouts: 10% → 25% → 50% → 100% over 30 min |
| PROD | Monitor → complete/rollback | Prometheus: auto-rollback if error rate >1% or p99 latency >2s |

---
## Compliance Deltas

| Standard | Phase 2 delta | Phase 3 delta | Registry / Deploy delta |
|---|---|---|---|
| FIPS 140-2/3 | Build `--target runtime-fips` | Push both `:$SHA` and `:$SHA-fips`; sign both | Store both tags; verify-sign both on pull |
| PCI DSS 4.0 | Fail on any CRITICAL CVE (trivy --exit-code 1 --severity CRITICAL) | Zero CRITICAL CVEs before sign | Immutable tags; log all pull events |
| HIPAA | Fail on HIGH+CRITICAL; scan source for PHI patterns | Enforce TLS 1.2+; non-root USER in Dockerfile | Restrict pull to HIPAA-scoped namespaces only |
| FedRAMP | FIPS build required; SLSA Level 3 attestation | FIPS-certified runtime image; cosign sign | Deploy to GovCloud region only |
| CMMC 2.0 Level 2 | Named reviewers only for CUI-touching PRs | Full audit trail; retain artifacts 3 years | US-only regions; no cross-border replication |
| SOC 2 Type II | Save all scan results as CI artifacts | Retain logs, SBOMs, scan results per pipeline run | Pull logging enabled; image retention policy documented |
| SOX | Separate-team reviewer required (4-eyes) | Change management ticket required before merge | Immutable tags; no manual prod overwrites; audit log to GRC |
| GDPR | Scan source for hardcoded PII; fail on any match | Log data processing purpose in image labels | Registry in EU region only |
| PIPEDA / Quebec Law 25 | Scan for Canadian PII (SIN, postal codes) | Document data processing purpose in image metadata | Registry in ca-central-1 / Canada Central only |
| NERC CIP | No internet access during build; all deps pre-vendored | All deps vendored; offline build environment | Air-gapped private registry; no public pull |
| ISO 27001 | Risk-based scan thresholds documented per asset class | Retain all artifacts 3–5 years | Annual credential rotation; quarterly access review |

---
## Checklist

- [ ] Phase 0 complete (branch protection, OIDC, Kyverno, Renovate/Dependabot)
- [ ] Phase 1 hooks installed and passing locally
- [ ] Phase 2 gate passing — all parallel stages green (SCA, SAST, license, IaC, secrets, container scan)
- [ ] Phase 3 app build clean
- [ ] Phase 3 standard image built and pushed
- [ ] Phase 3 FIPS image built and pushed
- [ ] Phase 3 container scan clean (registry image — post-push)
- [ ] Phase 3 image signed (cosign keyless OIDC)
- [ ] SBOM generated and attested
- [ ] SLSA Level 3 provenance attached
- [ ] Release tag applied (semver)
- [ ] Tests passing + Codecov coverage uploaded
- [ ] DAST scan clean
- [ ] Perf baseline recorded
- [ ] All 6 registries configured
- [ ] Sign verify passing in registry
- [ ] SBOM attached to registry image
- [ ] Promotions pipeline live (DEV → TEST → STAGING → PROD)
- [ ] Integration tests passing at DEV
- [ ] Contract tests passing at TEST
- [ ] Regression tests passing at STAGING
- [ ] Canary + monitor configured at PROD
- [ ] Compliance deltas applied for all applicable standards
