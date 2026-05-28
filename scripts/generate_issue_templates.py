#!/usr/bin/env python3
"""
Generate 75 GitHub Issue Templates for pipeline-studio.

Outputs to: .github/ISSUE_TEMPLATE/pipeline-setup/*.md

Update scripts/issue-config.yml when tools/images/compliance change,
then re-run this script. All 75 templates regenerate automatically.

Usage:
    python3 scripts/generate_issue_templates.py
"""

import os
import re

# ─── SHARED CONFIG (update here when tools/images change) ───────────────

COMPLIANCE = "FIPS 140-2/3 | PCI DSS | HIPAA | FedRAMP | CMMC | SOC 2 | SOX | GDPR | PIPEDA | NERC CIP | ISO 27001"

BUILD_IMAGE = "ubuntu:24.04"

COMPLIANCE_DELTAS = """\
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
"""

PHASE_0 = """\
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
"""

REGISTRY_SECTION = """\
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
"""

PROMOTIONS = """\
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
"""

SHARED_SECRETS_IAC = """\
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
"""

SHARED_CONTAINER_SCAN = """\
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
"""

SHARED_SIGN_SLSA = """\
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
"""

SHARED_DAST_PERF = """\
**DAST** (pick one):

| Tool | Command |
|---|---|
| OWASP ZAP | `zap-baseline.py -t http://localhost:{port}` |
| Nuclei | `nuclei -u http://localhost:{port} -severity medium,high,critical` |
| Burp Suite API | `burp-rest-api --burp-headless -u http://localhost:{port}` |

**Perf test** (pick one):

| Tool | Command |
|---|---|
| k6 | `k6 run perf/smoke.js` |
| Gatling | `gatling.sh -sf src/gatling -s BasicSimulation` |
| Artillery | `artillery run perf/smoke.yml` |

**Notify:**
`uses: slackapi/slack-github-action@v1  # post job status to #deployments channel`
"""

DOCKERFILE_LINT = """\
**Dockerfile lint** (pick one):

| Tool | Command |
|---|---|
| hadolint | `hadolint Dockerfile` |
| checkov | `checkov -d . --framework dockerfile` |

"""

PRE_COMMIT_HOOKS = """\
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

"""

# ─── LANGUAGE PROFILES ──────────────────────────────────────────────────

LANG = {

'nodejs-node': {
    'display': 'Node.js',
    'ide': 'ESLint + Prettier + SonarLint (VS Code / WebStorm)',
    'has_dockerfile': True,
    'sca_local': [
        ('npm', 'npm audit --audit-level=high'),
        ('yarn', 'yarn audit --level high'),
        ('pnpm', 'pnpm audit --audit-level high'),
        ('osv-scanner', 'osv-scanner --lockfile package-lock.json'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('njsscan', 'njsscan --json . > njsscan.json'),
        ('eslint-security', 'eslint . --plugin security'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: javascript-typescript'),
    ],
    'license': [
        ('license-checker', 'npx license-checker --production --failOn "GPL;AGPL"'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('npm', 'npm ci && npm run build'),
        ('yarn', 'yarn install --frozen-lockfile && yarn build'),
        ('pnpm', 'pnpm install --frozen-lockfile && pnpm build'),
    ],
    'test': 'npm test -- --coverage --coverageReporters=lcov && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
        ('cyclonedx-npm', 'cyclonedx-npm --output sbom.cdx.json'),
    ],
},

'nodejs-nginx': {
    'display': 'Node.js → nginx',
    'ide': 'ESLint + Prettier + SonarLint (VS Code / WebStorm)',
    'has_dockerfile': True,
    'sca_local': [
        ('npm', 'npm audit --audit-level=high'),
        ('yarn', 'yarn audit --level high'),
        ('pnpm', 'pnpm audit --audit-level high'),
        ('osv-scanner', 'osv-scanner --lockfile package-lock.json'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('njsscan', 'njsscan --json . > njsscan.json'),
        ('eslint-security', 'eslint . --plugin security'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: javascript-typescript'),
    ],
    'license': [
        ('license-checker', 'npx license-checker --production --failOn "GPL;AGPL"'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('npm', 'npm ci && npm run build'),
        ('yarn', 'yarn install --frozen-lockfile && yarn build'),
        ('pnpm', 'pnpm install --frozen-lockfile && pnpm build'),
    ],
    'test': 'npm test -- --coverage --coverageReporters=lcov && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
        ('cyclonedx-npm', 'cyclonedx-npm --output sbom.cdx.json'),
    ],
},

'hugo': {
    'display': 'Hugo',
    'ide': 'Hugo CLI + VS Code (Hugo Language Server)',
    'has_dockerfile': True,
    'sca_local': [
        ('osv-scanner', 'osv-scanner --lockfile go.sum'),
        ('nancy', 'go list -json -m all | nancy sleuth'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: go'),
    ],
    'license': [
        ('go-licenses', 'go-licenses check ./...'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('hugo', 'hugo --minify'),
    ],
    'test': 'hugo --minify && echo "Build clean"',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
    ],
},

'deno': {
    'display': 'Deno',
    'ide': 'Deno + VS Code (Deno extension)',
    'has_dockerfile': True,
    'sca_local': [
        ('deno', 'deno audit'),
        ('osv-scanner', 'osv-scanner --lockfile deno.lock'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: javascript-typescript'),
    ],
    'license': [
        ('deno-license-checker', 'deno run --allow-read jsr:@nicolo-ribaudo/deno-license-checker'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('deno', 'deno task build'),
    ],
    'test': 'deno test --coverage=cov/ && deno coverage cov/ --lcov > cov.lcov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
    ],
},

'bun': {
    'display': 'Bun',
    'ide': 'Bun + VS Code',
    'has_dockerfile': True,
    'sca_local': [
        ('bun', 'bun pm audit'),
        ('osv-scanner', 'osv-scanner --lockfile bun.lockb'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: javascript-typescript'),
    ],
    'license': [
        ('license-checker', 'bunx license-checker --production --failOn "GPL;AGPL"'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('bun', 'bun install --frozen-lockfile && bun build'),
    ],
    'test': 'bun test --coverage && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
    ],
},

'python': {
    'display': 'Python',
    'ide': 'Pylance + Black + Ruff + SonarLint (VS Code / PyCharm)',
    'has_dockerfile': True,
    'sca_local': [
        ('pip-audit', 'pip-audit --vulnerability-service pypi'),
        ('safety', 'safety check --json > safety.json'),
        ('osv-scanner', 'osv-scanner --lockfile requirements.txt'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('bandit', 'bandit -r . -ll -o bandit.json -f json'),
        ('semgrep', 'semgrep --config=auto .'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: python'),
    ],
    'license': [
        ('pip-licenses', 'pip-licenses --format=json'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('pip', 'pip install -r requirements.txt'),
        ('poetry', 'poetry install --no-dev'),
        ('uv', 'uv pip install -r requirements.txt'),
    ],
    'test': 'pytest --cov=. --cov-report=xml && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
        ('cyclonedx-py', 'cyclonedx-py -o sbom.cdx.json'),
    ],
},

'go': {
    'display': 'Go',
    'ide': 'gopls + staticcheck + golangci-lint (VS Code / GoLand)',
    'has_dockerfile': True,
    'sca_local': [
        ('govulncheck', 'govulncheck ./...'),
        ('nancy', 'go list -json -m all | nancy sleuth'),
        ('osv-scanner', 'osv-scanner --lockfile go.sum'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('gosec', 'gosec -fmt json -out gosec.json ./...'),
        ('staticcheck', 'staticcheck ./...'),
        ('semgrep', 'semgrep --config=auto .'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: go'),
    ],
    'license': [
        ('go-licenses', 'go-licenses check ./...'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('go', 'CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app ./...'),
    ],
    'test': 'go test ./... -coverprofile=coverage.out && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
        ('cyclonedx-gomod', 'cyclonedx-gomod app -output sbom.cdx.json'),
    ],
},

'java': {
    'display': 'Java JVM',
    'ide': 'IntelliJ IDEA + SonarLint + SpotBugs plugin',
    'has_dockerfile': True,
    'sca_local': [
        ('OWASP Dependency-Check', 'dependency-check --scan . --format JSON'),
        ('osv-scanner', 'osv-scanner --lockfile pom.xml'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('spotbugs', 'mvn spotbugs:check  # or ./gradlew spotbugsMain'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: java'),
    ],
    'license': [
        ('license-maven-plugin', 'mvn license:check  # or ./gradlew checkLicense'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('maven', 'mvn -B package --file pom.xml -DskipTests'),
        ('gradle', './gradlew build -x test'),
    ],
    'test': 'mvn test  # or ./gradlew test && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
        ('cyclonedx-maven', 'mvn org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom'),
    ],
},

'kotlin': {
    'display': 'Kotlin JVM',
    'ide': 'IntelliJ IDEA + SonarLint + Detekt plugin',
    'has_dockerfile': True,
    'sca_local': [
        ('OWASP Dependency-Check', 'dependency-check --scan . --format JSON'),
        ('osv-scanner', 'osv-scanner --lockfile gradle.lockfile'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('detekt', './gradlew detekt'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: java-kotlin'),
    ],
    'license': [
        ('license-gradle-plugin', './gradlew checkLicense'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('gradle', './gradlew build -x test'),
    ],
    'test': './gradlew test && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
        ('cyclonedx-gradle', './gradlew cyclonedxBom'),
    ],
},

'dotnet': {
    'display': '.NET',
    'ide': 'JetBrains Rider + Roslyn Analyzer + SonarLint',
    'has_dockerfile': True,
    'sca_local': [
        ('dotnet', 'dotnet list package --vulnerable --include-transitive'),
        ('osv-scanner', 'osv-scanner --lockfile packages.lock.json'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('security-code-scan', 'dotnet build /p:AdditionalFileItemNames=$(ProjectName).SecurityCodeScan'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: csharp'),
    ],
    'license': [
        ('dotnet-project-licenses', 'dotnet-project-licenses --input . --output licenses.json'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('dotnet', 'dotnet publish -c Release -o out --self-contained false'),
    ],
    'test': 'dotnet test --collect:"XPlat Code Coverage" && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
        ('cyclonedx-dotnet', 'cyclonedx . --output sbom.cdx.json'),
    ],
},

'rust': {
    'display': 'Rust',
    'ide': 'rust-analyzer + VS Code (rust-analyzer extension)',
    'has_dockerfile': True,
    'sca_local': [
        ('cargo-audit', 'cargo audit'),
        ('cargo-deny', 'cargo deny check'),
        ('osv-scanner', 'osv-scanner --lockfile Cargo.lock'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('clippy', 'cargo clippy -- -D warnings'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: rust'),
    ],
    'license': [
        ('cargo-license', 'cargo license --json'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('cargo', 'cargo build --release --target x86_64-unknown-linux-musl'),
    ],
    'test': 'cargo test --workspace && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
        ('cyclonedx-rust', 'cargo cyclonedx --format json'),
    ],
},

'elixir': {
    'display': 'Elixir BEAM',
    'ide': 'ElixirLS + VS Code (ElixirLS extension)',
    'has_dockerfile': True,
    'sca_local': [
        ('mix-audit', 'mix deps.audit'),
        ('sobelow', 'mix sobelow --config'),
        ('osv-scanner', 'osv-scanner --lockfile mix.lock'),
    ],
    'sast_local': [
        ('credo', 'mix credo --strict'),
        ('sobelow', 'mix sobelow --config'),
        ('semgrep', 'semgrep --config=auto .'),
    ],
    'license': [
        ('ex_license', 'mix licenses'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('mix', 'MIX_ENV=prod mix do deps.get, release'),
    ],
    'test': 'mix test --cover && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
    ],
},

'ruby': {
    'display': 'Ruby',
    'ide': 'Solargraph + RuboCop + VS Code',
    'has_dockerfile': True,
    'sca_local': [
        ('bundler-audit', 'bundle exec bundle-audit check --update'),
        ('osv-scanner', 'osv-scanner --lockfile Gemfile.lock'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('brakeman', 'brakeman -o brakeman.json'),
        ('semgrep', 'semgrep --config=auto .'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: ruby'),
    ],
    'license': [
        ('license_finder', 'license_finder'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('bundler', 'bundle install --without development test'),
    ],
    'test': 'bundle exec rspec --format documentation && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
        ('cyclonedx-ruby', 'cyclonedx-ruby -p . -o sbom.cdx.json'),
    ],
},

'php': {
    'display': 'PHP',
    'ide': 'PhpStorm + Psalm + PHP_CodeSniffer',
    'has_dockerfile': True,
    'sca_local': [
        ('composer-audit', 'composer audit'),
        ('local-php-security-checker', 'local-php-security-checker'),
        ('osv-scanner', 'osv-scanner --lockfile composer.lock'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('psalm', 'vendor/bin/psalm --output-format=json'),
        ('phpstan', 'vendor/bin/phpstan analyse --level max'),
        ('semgrep', 'semgrep --config=auto .'),
    ],
    'license': [
        ('composer-license-checker', 'vendor/bin/composer-license-checker check'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('composer', 'composer install --no-dev --optimize-autoloader'),
    ],
    'test': 'vendor/bin/phpunit --coverage-clover coverage.xml && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
        ('cyclonedx-php', 'vendor/bin/cyclonedx-php-composer make-sbom --output-format=JSON'),
    ],
},

'swift-server': {
    'display': 'Swift Server',
    'ide': 'Xcode + Swift Package Manager + sourcekit-lsp',
    'has_dockerfile': True,
    'sca_local': [
        ('osv-scanner', 'osv-scanner --lockfile Package.resolved'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: swift'),
    ],
    'license': [
        ('swift-package-list', 'swift package-list --output-format json'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('swift', 'swift build -c release'),
    ],
    'test': 'swift test --enable-code-coverage && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
    ],
},

'scala': {
    'display': 'Scala JVM',
    'ide': 'IntelliJ IDEA + Metals + Scalafmt',
    'has_dockerfile': True,
    'sca_local': [
        ('sbt-dependency-check', 'sbt dependencyCheck'),
        ('osv-scanner', 'osv-scanner --lockfile build.sbt'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('scalafmt', 'scalafmt --check'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: java'),
    ],
    'license': [
        ('sbt-license-report', 'sbt dumpLicenseReport'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('sbt', 'sbt assembly  # or sbt dist for Play'),
    ],
    'test': 'sbt test && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
        ('sbt-cyclonedx', 'sbt cyclonedxBom'),
    ],
},

'clojure': {
    'display': 'Clojure JVM',
    'ide': 'Calva + VS Code (Calva extension)',
    'has_dockerfile': True,
    'sca_local': [
        ('nvd-clojure', 'clojure -M:nvd check'),
        ('osv-scanner', 'osv-scanner --lockfile deps.edn'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('clj-kondo', 'clj-kondo --lint src'),
        ('semgrep', 'semgrep --config=auto .'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: java'),
    ],
    'license': [
        ('lein-licenses', 'lein licenses  # or clojure -M:licenses'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('lein', 'lein uberjar'),
        ('clojure tools.build', 'clojure -T:build uber'),
    ],
    'test': 'lein test  # or clojure -M:test && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
    ],
},

'cpp': {
    'display': 'C/C++',
    'ide': 'clangd + CMake Tools + VS Code',
    'has_dockerfile': True,
    'sca_local': [
        ('vcpkg-audit', 'vcpkg audit  # or conan inspect'),
        ('osv-scanner', 'osv-scanner --lockfile conan.lock'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('cppcheck', 'cppcheck --enable=all --xml . 2> cppcheck.xml'),
        ('clang-tidy', 'clang-tidy -p build src/**/*.cpp'),
        ('semgrep', 'semgrep --config=auto .'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: cpp'),
    ],
    'license': [
        ('licensecheck', 'licensecheck -r .'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build': [
        ('cmake', 'cmake -B build -DCMAKE_BUILD_TYPE=Release && cmake --build build'),
    ],
    'test': 'cd build && ctest --output-on-failure && codecov',
    'sbom': [
        ('syft', 'syft $REGISTRY/$IMAGE:$SHA -o spdx-json > sbom.spdx.json'),
    ],
},

# ─── CI-only language groups ─────────────────────────────────────────

'mobile-js': {
    'display': 'Mobile JS',
    'ide': 'ESLint + React Native Tools (VS Code)',
    'has_dockerfile': False,
    'sca_local': [
        ('npm', 'npm audit --audit-level=high'),
        ('osv-scanner', 'osv-scanner --lockfile package-lock.json'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('eslint-security', 'eslint . --plugin security'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: javascript-typescript'),
    ],
    'license': [
        ('license-checker', 'npx license-checker --production --failOn "GPL;AGPL"'),
    ],
    'build_ci': 'npx react-native build-android  # or: eas build --profile preview --platform android',
    'test': 'npm test -- --coverage && codecov',
    'artifact': 'APK / IPA',
},

'mobile-nonjs': {
    'display': 'Mobile non-JS',
    'ide': 'Android Studio / Xcode / VS Code + Flutter plugin',
    'has_dockerfile': False,
    'sca_local': [
        ('osv-scanner', 'osv-scanner --lockfile pubspec.lock  # or packages.lock.json'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: java-kotlin or csharp'),
    ],
    'license': [
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build_ci': 'flutter build apk --release  # or: dotnet build -c Release / ./gradlew assembleRelease',
    'test': 'flutter test --coverage  # or dotnet test / ./gradlew test',
    'artifact': 'APK / IPA',
},

'ios-native': {
    'display': 'iOS native',
    'ide': 'Xcode + Instruments + SwiftLint',
    'has_dockerfile': False,
    'sca_local': [
        ('osv-scanner', 'osv-scanner --lockfile Package.resolved'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: swift'),
    ],
    'license': [
        ('swift-package-list', 'swift package-list --output-format json'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build_ci': 'xcodebuild -scheme MyApp -configuration Release archive -archivePath MyApp.xcarchive',
    'test': 'xcodebuild test -scheme MyApp -destination platform=iOS Simulator,name=iPhone 15',
    'artifact': 'IPA',
},

'android-native': {
    'display': 'Android native',
    'ide': 'Android Studio + Lint + Detekt',
    'has_dockerfile': False,
    'sca_local': [
        ('OWASP Dependency-Check', 'dependency-check --scan . --format JSON'),
        ('osv-scanner', 'osv-scanner --lockfile gradle.lockfile'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('detekt', './gradlew detekt'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: java-kotlin'),
    ],
    'license': [
        ('license-gradle-plugin', './gradlew checkLicense'),
        ('FOSSA', 'fossa analyze && fossa test'),
    ],
    'build_ci': './gradlew assembleRelease  # or bundleRelease for AAB',
    'test': './gradlew test && codecov',
    'artifact': 'APK / AAB',
},

'edge': {
    'display': 'Edge',
    'ide': 'VS Code + Miniflare (Cloudflare Workers local dev)',
    'has_dockerfile': False,
    'sca_local': [
        ('npm', 'npm audit --audit-level=high'),
        ('osv-scanner', 'osv-scanner --lockfile package-lock.json'),
        ('snyk', 'snyk test --severity-threshold=high'),
    ],
    'sast_local': [
        ('semgrep', 'semgrep --config=auto .'),
        ('eslint-security', 'eslint . --plugin security'),
        ('CodeQL', 'uses: github/codeql-action/analyze@v3  # languages: javascript-typescript'),
    ],
    'license': [
        ('license-checker', 'npx license-checker --production --failOn "GPL;AGPL"'),
    ],
    'build_ci': 'npm run build  # or: wrangler build (Cloudflare) / vercel build',
    'test': 'npm test -- --coverage && codecov',
    'artifact': 'edge bundle (Worker / Edge Function)',
},

}

# ─── FRAMEWORK DEFINITIONS (75 total) ───────────────────────────────────

FRAMEWORKS = [
# 01 SSR/Hybrid
{'num':21,'cat':'01 SSR/Hybrid','name':'Next.js','ver':'16.2.6','slug':'01-nextjs','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':22,'cat':'01 SSR/Hybrid','name':'Remix','ver':'7','slug':'01-remix','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':23,'cat':'01 SSR/Hybrid','name':'Nuxt','ver':'4.4','slug':'01-nuxt','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':24,'cat':'01 SSR/Hybrid','name':'SvelteKit','ver':'2.57','slug':'01-sveltekit','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':25,'cat':'01 SSR/Hybrid','name':'Angular SSR','ver':'20','slug':'01-angular-ssr','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':4000},
# 02 CSR/SPA
{'num':26,'cat':'02 CSR/SPA','name':'React','ver':'19','slug':'02-react','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':27,'cat':'02 CSR/SPA','name':'Vue','ver':'3.5','slug':'02-vue','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':28,'cat':'02 CSR/SPA','name':'Angular','ver':'20','slug':'02-angular','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':29,'cat':'02 CSR/SPA','name':'Svelte','ver':'5','slug':'02-svelte','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':30,'cat':'02 CSR/SPA','name':'Solid.js','ver':'2.0','slug':'02-solidjs','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
# 03 SSG
{'num':31,'cat':'03 SSG','name':'Astro','ver':'6.3','slug':'03-astro','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':32,'cat':'03 SSG','name':'Eleventy','ver':'3.0','slug':'03-eleventy','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':33,'cat':'03 SSG','name':'Hugo','ver':'0.161','slug':'03-hugo','lang':'hugo','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':34,'cat':'03 SSG','name':'Gatsby','ver':'5.13','slug':'03-gatsby','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
# 04 Islands
{'num':35,'cat':'04 Islands','name':'Astro','ver':'6.3','slug':'04-astro','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':36,'cat':'04 Islands','name':'Fresh','ver':'2.3','slug':'04-fresh','lang':'deno','pattern':'multi-stage','runtime':'denoland/deno:2.3-alpine','fips_rt':'denoland/deno:2.3-alpine (no dedicated FIPS variant)','port':8000},
# 05 Resumability
{'num':37,'cat':'05 Resumability','name':'Qwik','ver':'2.0','slug':'05-qwik','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
# 06 Edge Rendering
{'num':38,'cat':'06 Edge Rendering','name':'Next.js Edge','ver':'16','slug':'06-nextjs-edge','lang':'edge','pattern':'ci-only','runtime':'N/A (CI-only — edge runtime)','fips_rt':'N/A (no FIPS variant)','port':None},
{'num':39,'cat':'06 Edge Rendering','name':'Hono','ver':'4.7','slug':'06-hono-edge','lang':'edge','pattern':'ci-only','runtime':'N/A (CI-only — edge runtime)','fips_rt':'N/A (no FIPS variant)','port':None},
{'num':40,'cat':'06 Edge Rendering','name':'Remix Cloudflare','ver':'7','slug':'06-remix-cloudflare','lang':'edge','pattern':'ci-only','runtime':'N/A (CI-only — edge runtime)','fips_rt':'N/A (no FIPS variant)','port':None},
# 07 Streaming SSR
{'num':41,'cat':'07 Streaming SSR','name':'Next.js App Router','ver':'16','slug':'07-nextjs-app-router','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':42,'cat':'07 Streaming SSR','name':'Remix','ver':'7','slug':'07-remix','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':43,'cat':'07 Streaming SSR','name':'SvelteKit','ver':'2.57','slug':'07-sveltekit','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
# 08 Micro-frontends
{'num':44,'cat':'08 Micro-frontends','name':'Module Federation Webpack','ver':'5','slug':'08-mf-webpack','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':45,'cat':'08 Micro-frontends','name':'Module Federation Rspack','ver':'1','slug':'08-mf-rspack','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':46,'cat':'08 Micro-frontends','name':'single-spa','ver':'6.0','slug':'08-single-spa','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
# 09 Cross-platform JS
{'num':47,'cat':'09 Cross-platform JS','name':'React Native','ver':'0.79','slug':'09-react-native','lang':'mobile-js','pattern':'ci-only','runtime':'N/A (CI-only — APK/IPA)','fips_rt':'N/A (no FIPS variant)','port':None},
{'num':48,'cat':'09 Cross-platform JS','name':'Expo','ver':'52','slug':'09-expo','lang':'mobile-js','pattern':'ci-only','runtime':'N/A (CI-only — APK/IPA)','fips_rt':'N/A (no FIPS variant)','port':None},
{'num':49,'cat':'09 Cross-platform JS','name':'Ionic','ver':'8','slug':'09-ionic','lang':'mobile-js','pattern':'ci-only','runtime':'N/A (CI-only — APK/IPA)','fips_rt':'N/A (no FIPS variant)','port':None},
# 10 Cross-platform non-JS
{'num':50,'cat':'10 Cross-platform non-JS','name':'Flutter','ver':'3.44','slug':'10-flutter','lang':'mobile-nonjs','pattern':'ci-only','runtime':'N/A (CI-only — APK/IPA)','fips_rt':'N/A (no FIPS variant)','port':None},
{'num':51,'cat':'10 Cross-platform non-JS','name':'.NET MAUI','ver':'10','slug':'10-dotnet-maui','lang':'mobile-nonjs','pattern':'ci-only','runtime':'N/A (CI-only — APK/IPA)','fips_rt':'N/A (no FIPS variant)','port':None},
{'num':52,'cat':'10 Cross-platform non-JS','name':'Kotlin Multiplatform','ver':'2.1','slug':'10-kmp','lang':'mobile-nonjs','pattern':'ci-only','runtime':'N/A (CI-only — APK/IPA)','fips_rt':'N/A (no FIPS variant)','port':None},
# 11 Native iOS
{'num':53,'cat':'11 Native iOS','name':'Swift / SwiftUI','ver':'6','slug':'11-swift-swiftui','lang':'ios-native','pattern':'ci-only','runtime':'N/A (CI-only — IPA)','fips_rt':'N/A (no FIPS variant)','port':None},
{'num':54,'cat':'11 Native iOS','name':'Objective-C UIKit','ver':'SDK 17','slug':'11-objc-uikit','lang':'ios-native','pattern':'ci-only','runtime':'N/A (CI-only — IPA)','fips_rt':'N/A (no FIPS variant)','port':None},
# 12 Native Android
{'num':55,'cat':'12 Native Android','name':'Kotlin Jetpack Compose','ver':'2.0','slug':'12-kotlin-jetpack','lang':'android-native','pattern':'ci-only','runtime':'N/A (CI-only — APK/AAB)','fips_rt':'N/A (no FIPS variant)','port':None},
{'num':56,'cat':'12 Native Android','name':'Java Android SDK','ver':'17','slug':'12-java-android','lang':'android-native','pattern':'ci-only','runtime':'N/A (CI-only — APK/AAB)','fips_rt':'N/A (no FIPS variant)','port':None},
# 13 PWA
{'num':57,'cat':'13 PWA','name':'Workbox','ver':'7.3','slug':'13-workbox','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
{'num':58,'cat':'13 PWA','name':'Vite PWA Plugin','ver':'0.21','slug':'13-vite-pwa','lang':'nodejs-nginx','pattern':'multi-stage','runtime':'nginx:alpine','fips_rt':'registry.access.redhat.com/ubi9/nginx-122','port':80},
# 14 Node/Deno/Bun
{'num':59,'cat':'14 Node/Deno/Bun','name':'Express','ver':'5.0','slug':'14-express','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':60,'cat':'14 Node/Deno/Bun','name':'Fastify','ver':'5.2','slug':'14-fastify','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':61,'cat':'14 Node/Deno/Bun','name':'NestJS','ver':'11.0','slug':'14-nestjs','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':62,'cat':'14 Node/Deno/Bun','name':'Hono','ver':'4.7','slug':'14-hono','lang':'nodejs-node','pattern':'multi-stage','runtime':'node:22-alpine','fips_rt':'registry.access.redhat.com/ubi9/nodejs-22-minimal','port':3000},
{'num':63,'cat':'14 Node/Deno/Bun','name':'Deno','ver':'2.3','slug':'14-deno','lang':'deno','pattern':'multi-stage','runtime':'denoland/deno:2.3-alpine','fips_rt':'denoland/deno:2.3-alpine (no dedicated FIPS variant)','port':8000},
{'num':64,'cat':'14 Node/Deno/Bun','name':'Elysia','ver':'1.2','slug':'14-elysia','lang':'bun','pattern':'multi-stage','runtime':'oven/bun:1-alpine','fips_rt':'oven/bun:1-alpine (no dedicated FIPS variant)','port':3000},
# 15 Python
{'num':65,'cat':'15 Python','name':'FastAPI','ver':'0.115','slug':'15-fastapi','lang':'python','pattern':'multi-stage','runtime':'python:3.12-slim','fips_rt':'registry.access.redhat.com/ubi9/python-39','port':8080},
{'num':66,'cat':'15 Python','name':'Django','ver':'5.2','slug':'15-django','lang':'python','pattern':'multi-stage','runtime':'python:3.12-slim','fips_rt':'registry.access.redhat.com/ubi9/python-39','port':8080},
{'num':67,'cat':'15 Python','name':'Flask','ver':'3.1','slug':'15-flask','lang':'python','pattern':'multi-stage','runtime':'python:3.12-slim','fips_rt':'registry.access.redhat.com/ubi9/python-39','port':8080},
{'num':68,'cat':'15 Python','name':'Starlette','ver':'0.41','slug':'15-starlette','lang':'python','pattern':'multi-stage','runtime':'python:3.12-slim','fips_rt':'registry.access.redhat.com/ubi9/python-39','port':8080},
# 16 Go
{'num':69,'cat':'16 Go','name':'Gin','ver':'1.10','slug':'16-gin','lang':'go','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
{'num':70,'cat':'16 Go','name':'Echo','ver':'4.12','slug':'16-echo','lang':'go','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
{'num':71,'cat':'16 Go','name':'Fiber','ver':'3.0','slug':'16-fiber','lang':'go','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
{'num':72,'cat':'16 Go','name':'Chi','ver':'5.2','slug':'16-chi','lang':'go','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
# 17 Java
{'num':73,'cat':'17 Java','name':'Spring Boot','ver':'3.4','slug':'17-spring-boot','lang':'java','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
{'num':74,'cat':'17 Java','name':'Quarkus','ver':'3.35','slug':'17-quarkus','lang':'java','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
{'num':75,'cat':'17 Java','name':'Micronaut','ver':'5.0','slug':'17-micronaut','lang':'java','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
# 18 Kotlin
{'num':76,'cat':'18 Kotlin','name':'Ktor','ver':'3.5','slug':'18-ktor','lang':'kotlin','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
{'num':77,'cat':'18 Kotlin','name':'Spring Boot Kotlin','ver':'3.4','slug':'18-spring-boot-kotlin','lang':'kotlin','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
# 19 .NET
{'num':78,'cat':'19 .NET','name':'ASP.NET Core','ver':'9','slug':'19-aspnet-core','lang':'dotnet','pattern':'multi-stage','runtime':'mcr.microsoft.com/dotnet/aspnet:9.0-alpine','fips_rt':'mcr.microsoft.com/dotnet/aspnet:9.0-cbl-mariner2.0-fips','port':8080},
{'num':79,'cat':'19 .NET','name':'Minimal APIs .NET','ver':'9','slug':'19-minimal-apis','lang':'dotnet','pattern':'multi-stage','runtime':'mcr.microsoft.com/dotnet/aspnet:9.0-alpine','fips_rt':'mcr.microsoft.com/dotnet/aspnet:9.0-cbl-mariner2.0-fips','port':8080},
# 20 Rust
{'num':80,'cat':'20 Rust','name':'Axum','ver':'0.8','slug':'20-axum','lang':'rust','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
{'num':81,'cat':'20 Rust','name':'Actix-web','ver':'4.9','slug':'20-actix-web','lang':'rust','pattern':'multi-stage','runtime':'scratch','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
# 21 Elixir/BEAM
{'num':82,'cat':'21 Elixir/BEAM','name':'Phoenix','ver':'1.7','slug':'21-phoenix','lang':'elixir','pattern':'multi-stage','runtime':'hexpm/elixir:1.17-erlang-27-debian-bookworm-slim','fips_rt':'registry.access.redhat.com/ubi9/ubi-minimal','port':4000},
# 22 Ruby
{'num':83,'cat':'22 Ruby','name':'Rails','ver':'8.0','slug':'22-rails','lang':'ruby','pattern':'multi-stage','runtime':'ruby:3.3-alpine','fips_rt':'registry.access.redhat.com/ubi9/ruby-32','port':3000},
{'num':84,'cat':'22 Ruby','name':'Sinatra','ver':'4.0','slug':'22-sinatra','lang':'ruby','pattern':'multi-stage','runtime':'ruby:3.3-alpine','fips_rt':'registry.access.redhat.com/ubi9/ruby-32','port':3000},
# 23 PHP
{'num':85,'cat':'23 PHP','name':'Laravel','ver':'12','slug':'23-laravel','lang':'php','pattern':'single-stage','runtime':'php:8.3-fpm-alpine','fips_rt':'php:8.3-fpm-alpine (no FIPS variant; use Alpine FIPS kernel)','port':9000},
{'num':86,'cat':'23 PHP','name':'Symfony','ver':'7.2','slug':'23-symfony','lang':'php','pattern':'single-stage','runtime':'php:8.3-fpm-alpine','fips_rt':'php:8.3-fpm-alpine (no FIPS variant; use Alpine FIPS kernel)','port':9000},
{'num':87,'cat':'23 PHP','name':'Slim','ver':'4.14','slug':'23-slim','lang':'php','pattern':'single-stage','runtime':'php:8.3-fpm-alpine','fips_rt':'php:8.3-fpm-alpine (no FIPS variant; use Alpine FIPS kernel)','port':9000},
# 24 Swift Server
{'num':88,'cat':'24 Swift Server','name':'Vapor','ver':'4.121','slug':'24-vapor','lang':'swift-server','pattern':'multi-stage','runtime':'swift:6.0-noble-slim','fips_rt':'swift:6.0-noble-slim (no dedicated FIPS variant)','port':8080},
{'num':89,'cat':'24 Swift Server','name':'Hummingbird','ver':'2.0','slug':'24-hummingbird','lang':'swift-server','pattern':'multi-stage','runtime':'swift:6.0-noble-slim','fips_rt':'swift:6.0-noble-slim (no dedicated FIPS variant)','port':8080},
# 25 Scala
{'num':90,'cat':'25 Scala','name':'Play','ver':'3.0','slug':'25-play','lang':'scala','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':9000},
{'num':91,'cat':'25 Scala','name':'http4s','ver':'0.23','slug':'25-http4s','lang':'scala','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
# 26 Clojure
{'num':92,'cat':'26 Clojure','name':'Ring','ver':'1.12','slug':'26-ring','lang':'clojure','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
{'num':93,'cat':'26 Clojure','name':'Pedestal','ver':'0.7','slug':'26-pedestal','lang':'clojure','pattern':'multi-stage','runtime':'gcr.io/distroless/java21-debian12','fips_rt':'registry.access.redhat.com/ubi9/openjdk-21-runtime','port':8080},
# 27 C/C++
{'num':94,'cat':'27 C/C++','name':'Drogon','ver':'1.9.13','slug':'27-drogon','lang':'cpp','pattern':'multi-stage','runtime':'scratch (static) or debian:12-slim (dynamic)','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
{'num':95,'cat':'27 C/C++','name':'Crow','ver':'1.3.2','slug':'27-crow','lang':'cpp','pattern':'multi-stage','runtime':'scratch (static) or debian:12-slim (dynamic)','fips_rt':'registry.access.redhat.com/ubi9/ubi-micro','port':8080},
]

# ─── TEMPLATE BUILDERS ──────────────────────────────────────────────────

def tool_table(rows):
    lines = ['| Tool | Command |', '|---|---|']
    for name, cmd in rows:
        lines.append(f'| {name} | `{cmd}` |')
    return '\n'.join(lines)


def build_header(fw):
    pattern_display = {
        'multi-stage': 'Multi-stage',
        'single-stage': 'Single-stage',
        'ci-only': 'CI-only',
    }[fw['pattern']]
    lang = LANG[fw['lang']]
    port_str = str(fw['port']) if fw['port'] else 'None'
    return f"""\
**Category:** {fw['cat']}
**Pattern:** {pattern_display}
**Language:** {lang['display']}
**Runtime image:** `{fw['runtime']}`
**FIPS runtime:** `{fw['fips_rt']}`
**Build image:** `{BUILD_IMAGE}`
**Port:** {port_str}
**Compliance:** {COMPLIANCE}
"""


def build_phase1_multistage(fw):
    lang = LANG[fw['lang']]
    parts = []
    parts.append(f"## Phase 1 — Local Dev (on git commit)\n")
    parts.append(f"**IDE setup:** {lang['ide']}\n")
    parts.append(DOCKERFILE_LINT)
    parts.append(PRE_COMMIT_HOOKS)
    if lang.get('sca_local'):
        parts.append("**Local SCA — dependency audit** (pick one):\n")
        parts.append(tool_table(lang['sca_local']))
        parts.append("\n")
    parts.append("**Local SAST** (pick one):\n")
    parts.append(tool_table(lang['sast_local']))
    parts.append("\n")
    return '\n'.join(parts)


def build_phase1_cionly(fw):
    lang = LANG[fw['lang']]
    parts = []
    parts.append(f"## Phase 1 — Local Dev (on git commit)\n")
    parts.append(f"**IDE setup:** {lang['ide']}\n")
    parts.append(PRE_COMMIT_HOOKS)
    if lang.get('sca_local'):
        parts.append("**Local SCA — dependency audit** (pick one):\n")
        parts.append(tool_table(lang['sca_local']))
        parts.append("\n")
    parts.append("**Local SAST** (pick one):\n")
    parts.append(tool_table(lang['sast_local']))
    parts.append("\n")
    return '\n'.join(parts)


def build_phase2_multistage(fw):
    lang = LANG[fw['lang']]
    parts = ["## Phase 2 — PR Gate (every PR push)\n",
             "All security stages run in parallel after `pre-commit` passes.\n",
             "**Pre-commit (CI):**\n`pre-commit run --all-files`\n"]
    if lang.get('sca_local'):
        parts.append("**SCA ↗ parallel** (pick one):\n")
        parts.append(tool_table(lang['sca_local']))
        parts.append("\n")
    parts.append("**SAST ↗ parallel** (pick one):\n")
    parts.append(tool_table(lang['sast_local']))
    parts.append("\n")
    if lang.get('license'):
        parts.append("**License scan ↗ parallel** (pick one):\n")
        parts.append(tool_table(lang['license']))
        parts.append("\n")
    parts.append(SHARED_SECRETS_IAC)
    parts.append(SHARED_CONTAINER_SCAN)
    return '\n'.join(parts)


def build_phase2_cionly(fw):
    lang = LANG[fw['lang']]
    parts = ["## Phase 2 — PR Gate (every PR push)\n",
             "All security stages run in parallel after `pre-commit` passes.\n",
             "**Pre-commit (CI):**\n`pre-commit run --all-files`\n"]
    if lang.get('sca_local'):
        parts.append("**SCA ↗ parallel** (pick one):\n")
        parts.append(tool_table(lang['sca_local']))
        parts.append("\n")
    parts.append("**SAST ↗ parallel** (pick one):\n")
    parts.append(tool_table(lang['sast_local']))
    parts.append("\n")
    if lang.get('license'):
        parts.append("**License scan ↗ parallel** (pick one):\n")
        parts.append(tool_table(lang['license']))
        parts.append("\n")
    parts.append(SHARED_SECRETS_IAC)
    artifact = lang.get('artifact', 'artifact')
    build_ci = lang.get('build_ci', 'build')
    parts.append(f"**Build (no container):**\n`{build_ci}`\n")
    parts.append("**PR review:**\nHuman approval — CODEOWNERS enforced\n")
    return '\n'.join(parts)


def build_phase3_multistage(fw):
    lang = LANG[fw['lang']]
    port = fw['port'] or 8080
    parts = ["## Phase 3 — Main Build (on merge to main)\n",
             "**Pre-commit (CI):**\n`pre-commit run --all-files`\n"]
    if lang.get('sca_local'):
        parts.append("**SCA ↗ parallel** (pick one):\n")
        parts.append(tool_table(lang['sca_local']))
        parts.append("\n")
    parts.append("**SAST ↗ parallel** (pick one):\n")
    parts.append(tool_table(lang['sast_local']))
    parts.append("\n")
    if lang.get('license'):
        parts.append("**License scan ↗ parallel** (pick one):\n")
        parts.append(tool_table(lang['license']))
        parts.append("\n")
    # IaC scan (no soft-fail on main)
    parts.append("""\
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

""")
    parts.append("**App build** (pick one):\n")
    parts.append(tool_table(lang['build']))
    parts.append("\n")
    parts.append(SHARED_SIGN_SLSA)
    parts.append(f"\n**Tests + Codecov:**\n`{lang['test']}`\n")
    parts.append(SHARED_DAST_PERF.format(port=port))
    return '\n'.join(parts)


def build_phase3_cionly(fw):
    lang = LANG[fw['lang']]
    parts = ["## Phase 3 — Main Build (on merge to main)\n",
             "**Pre-commit (CI):**\n`pre-commit run --all-files`\n"]
    if lang.get('sca_local'):
        parts.append("**SCA ↗ parallel** (pick one):\n")
        parts.append(tool_table(lang['sca_local']))
        parts.append("\n")
    parts.append("**SAST ↗ parallel** (pick one):\n")
    parts.append(tool_table(lang['sast_local']))
    parts.append("\n")
    if lang.get('license'):
        parts.append("**License scan ↗ parallel** (pick one):\n")
        parts.append(tool_table(lang['license']))
        parts.append("\n")
    parts.append("""\
**Secrets scan ↗ parallel** (pick one):

| Tool | Command |
|---|---|
| trufflehog | `trufflehog git --only-verified .` |
| gitleaks | `gitleaks detect --source=. --report-path=gitleaks.json` |

""")
    build_ci = lang.get('build_ci', 'build')
    artifact = lang.get('artifact', 'artifact')
    parts.append(f"**App build ({artifact}):**\n`{build_ci}`\n")
    parts.append(f"\n**Tests + Codecov:**\n`{lang['test']}`\n")
    parts.append("""\
**Release tag:**
`semantic-release --no-ci` — applies semver tag to source

**Notify:**
`uses: slackapi/slack-github-action@v1  # post job status to #deployments channel`
""")
    return '\n'.join(parts)


def build_checklist_multistage():
    return """\
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
"""


def build_checklist_cionly(artifact):
    return f"""\
## Checklist

- [ ] Phase 0 complete (branch protection, OIDC, Renovate/Dependabot)
- [ ] Phase 1 hooks installed and passing locally
- [ ] Phase 2 gate passing — all parallel stages green (SAST, license, IaC, secrets)
- [ ] Phase 3 app build clean — {artifact} produced
- [ ] Release tag applied (semver)
- [ ] Tests passing + Codecov coverage uploaded
- [ ] Compliance deltas applied for all applicable standards
"""


def build_compliance_cionly():
    return """\
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
"""


def build_body(fw):
    is_cionly = fw['pattern'] == 'ci-only'
    lang = LANG[fw['lang']]
    artifact = lang.get('artifact', 'artifact')

    parts = [build_header(fw), '\n---\n', PHASE_0, '\n---\n']

    if is_cionly:
        parts.append(build_phase1_cionly(fw))
        parts.append('\n---\n')
        parts.append(build_phase2_cionly(fw))
        parts.append('\n---\n')
        parts.append(build_phase3_cionly(fw))
        parts.append('\n---\n')
        parts.append(build_compliance_cionly())
        parts.append('\n---\n')
        parts.append(build_checklist_cionly(artifact))
    else:
        parts.append(build_phase1_multistage(fw))
        parts.append('\n---\n')
        parts.append(build_phase2_multistage(fw))
        parts.append('\n---\n')
        parts.append(build_phase3_multistage(fw))
        parts.append('\n---\n')
        parts.append(REGISTRY_SECTION)
        parts.append('\n---\n')
        parts.append(PROMOTIONS)
        parts.append('\n---\n')
        parts.append(COMPLIANCE_DELTAS)
        parts.append('\n---\n')
        parts.append(build_checklist_multistage())

    return ''.join(parts)


def build_frontmatter(fw):
    name = f"[{fw['cat']}] {fw['name']} {fw['ver']} — pipeline setup"
    about = f"Pipeline setup for {fw['name']} {fw['ver']} ({fw['cat']}). Covers Phase 0–3, all 6 registries, DEV→PROD promotions, and all 11 compliance standards."
    return f"""\
---
name: "{name}"
about: "{about}"
labels: pipeline-setup
assignees: ''
---

"""


def build_template(fw):
    return build_frontmatter(fw) + build_body(fw)


# ─── MAIN ────────────────────────────────────────────────────────────────

def main():
    # Determine repo root (script lives in scripts/)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    out_dir = os.path.join(repo_root, '.github', 'ISSUE_TEMPLATE', 'pipeline-setup')
    os.makedirs(out_dir, exist_ok=True)

    # Write GitHub template chooser config
    config_path = os.path.join(repo_root, '.github', 'ISSUE_TEMPLATE', 'config.yml')
    with open(config_path, 'w') as f:
        f.write("""\
blank_issues_enabled: true
contact_links:
  - name: Pipeline Studio docs
    url: https://github.com/yarova-ca/pipeline-studio
    about: Reference documentation for all 75 framework pipeline configs.
""")

    count = 0
    for fw in FRAMEWORKS:
        content = build_template(fw)
        filename = f"{fw['slug']}.md"
        filepath = os.path.join(out_dir, filename)
        with open(filepath, 'w') as f:
            f.write(content)
        count += 1

    print(f"Generated {count} issue templates → {out_dir}")
    print(f"Generated config.yml → {config_path}")


if __name__ == '__main__':
    main()
