// Stage definitions for all pipeline phases.
// Ported from v1 LOCAL_STAGES, PR_STAGES, MAIN_STAGES, PROMOTION_STAGES.
// TV strings are inlined; see tools.ts for the full version map.

import type { InvariantId, StageId } from './types';
import { TV } from './tools';

export interface StageDef {
  id: StageId;
  badge: string;
  phase: string;
  title: string;
  tool?: string;
  invariants?: InvariantId[];
  actor?: string;
  trigger?: string;
  filesRead?: string;
  filesProduces?: string;
  onFailure?: string;
  orderAfter?: string;
  orderBefore?: string;
  yamlKey?: string;
  concept?: string;
  threat?: string;
  howItWorks?: string;
  outputMeaning?: string;
  whyOrder?: string;
  commonMistakes?: string;
  ciLimitation?: string;
  failureClass?: string;
}

export interface LocalStageDef {
  id: StageId;
  badge: string;
  phase: string;
  title: string;
  desc: string;
  tools: string[];
  setup: string;
}

export interface Phase0StageDef {
  id: StageId;
  badge: string;
  title: string;
  desc: string;
  steps: string[];
}

export interface ParallelGroup {
  id: string;
  parallel: true;
  stages: StageDef[];
}

export type PipelineItem = StageDef | ParallelGroup;

export function isParallel(item: PipelineItem): item is ParallelGroup {
  return (item as ParallelGroup).parallel === true;
}

// ── Phase 0 — Bootstrap ───────────────────────────────────────────────────────

export const PHASE_0_STAGES: Phase0StageDef[] = [
  {
    id: 'p0g1',
    badge: 'P0-1',
    title: 'Branch Protection + CODEOWNERS',
    desc: 'Prevent direct pushes to main. Require PR review. Block --no-verify bypasses.',
    steps: [
      'Require PRs to merge into main (no direct push)',
      'Require at least 1 code review approval',
      'Add CODEOWNERS file — auto-assign reviewers by path',
      'Dismiss stale reviews on new push',
      'Require status checks to pass before merge',
      'Restrict who can bypass branch protection'
    ]
  },
  {
    id: 'p0g2',
    badge: 'P0-2',
    title: 'OIDC Trust + Registry Access',
    desc: 'Configure keyless auth so CI never stores a registry password.',
    steps: [
      'Create OIDC trust between CI provider and cloud IAM',
      'Scope trust to exact repo + branch (not all workflows)',
      'Grant push permission to the container registry only',
      'Verify: pipeline logs show no stored credentials',
      'Document the IAM role ARN / workload identity in your runbook'
    ]
  },
  {
    id: 'p0g3',
    badge: 'P0-3',
    title: 'Pin All External Actions + Base Images',
    desc: 'SHA-pin every third-party action and base image to block supply chain substitution.',
    steps: [
      'Replace @v3 references with @sha256:... for all CI actions',
      'Set FROM image@sha256:... in every Dockerfile',
      'Use Dependabot / Renovate for automated SHA-bump PRs',
      'Require review on all dependency update PRs (I-15)',
      'Enable GitHub secret scanning + push protection on the repo'
    ]
  }
];

// ── Phase 1 — Local / Developer ───────────────────────────────────────────────

export const LOCAL_STAGES: LocalStageDef[] = [
  {
    id: 'l1', badge: 'L1', phase: 'ph-f',
    title: 'IDE Security Hints',
    desc: 'Real-time feedback as you type. Zero CI minutes spent.',
    tools: ['Snyk IDE plugin', 'Semgrep VS Code extension', 'SonarLint', 'GitHub Copilot security'],
    setup: 'Install one extension from your IDE marketplace. No config required for basic scanning.'
  },
  {
    id: 'l2', badge: 'L2', phase: 'ph-f',
    title: 'Pre-commit Hooks',
    desc: 'Blocks bad commits locally before they reach CI. Catches --no-verify bypasses in CI (S1 re-runs hooks).',
    tools: ['pre-commit framework', 'Gitleaks (secret scan)', 'hadolint (Dockerfile lint)', 'language-specific linters'],
    setup: 'pip install pre-commit && pre-commit install'
  },
  {
    id: 'l3', badge: 'L3', phase: 'ph-f',
    title: 'Local Lint + Format',
    desc: 'Fast local feedback loop. Same tools run in CI — fix before pushing.',
    tools: ['Biome / ESLint (JS/TS)', 'golangci-lint (Go)', 'ruff (Python)', 'cargo clippy (Rust)', 'checkstyle (Java)', 'rubocop (Ruby)'],
    setup: 'Configured via pre-commit hooks or direct tool install.'
  },
  {
    id: 'l4', badge: 'L4', phase: 'ph-f',
    title: 'Local Secret Scan',
    desc: 'Catches secrets before git commit. Runs as pre-commit hook.',
    tools: ['Gitleaks v8.18+', 'trufflehog (optional, slower but more thorough)'],
    setup: 'Added to .pre-commit-config.yaml as gitleaks hook. Runs on git commit.'
  }
];

// ── Phase 2 — PR Gate ─────────────────────────────────────────────────────────

export const PR_STAGES: PipelineItem[] = [
  {
    id: 's1', badge: 'S1', phase: 'ph-f',
    title: 'Pre-commit Hooks',
    tool: TV.preCommitAction + ' · re-run in CI',
    invariants: ['I-2'],
    actor: 'CI runner',
    trigger: 'First job — on every PR',
    filesRead: '.pre-commit-config.yaml',
    filesProduces: 'Pass/fail — no artifacts',
    onFailure: 'PR cannot merge. Developer must fix and re-push.',
    orderAfter: 'First stage. No prior dependency.',
    orderBefore: 'Runs before security scans. Catches formatting and obvious issues cheaply.',
    yamlKey: 'genS1',
    concept: 'Local commit guard that also re-runs in CI. Blocks bad commits at the source.',
    threat: 'Developer commits secrets, broken syntax, or bypasses code standards accidentally.',
    howItWorks: 'The pre-commit framework runs a configured list of hooks (small scripts) against staged files before git commit completes. CI re-runs the same hooks to catch --no-verify bypasses.',
    outputMeaning: 'Pass: all hooks returned exit code 0. Fail: hook name + file + line of violation printed to console.',
    whyOrder: 'First stage. Cheapest check. Catches syntax and formatting before wasting scan compute minutes.',
    commonMistakes: '--no-verify locally (CI S1 re-runs and blocks anyway) | Not pinning hook revs (autoupdate silently changes behavior) | Slow hooks >30s (breaks developer flow)'
  },
  {
    id: 'parallel-s2s5', parallel: true,
    stages: [
      {
        id: 's2', badge: 'S2', phase: 'ph-s',
        title: 'SCA — Dep Vulnerability',
        tool: TV.dependencyReview,
        invariants: ['I-3'],
        actor: 'CI runner', trigger: 'Parallel with other security scans',
        filesRead: 'package.json/go.mod/pom.xml/requirements.txt',
        filesProduces: 'SARIF → GitHub Security tab',
        onFailure: 'PR blocked. HIGH/CRITICAL CVE in dependency.',
        orderAfter: 'Parallel with S3/S3b/S4/S5', orderBefore: 'All must pass before build.',
        yamlKey: 'genS2',
        concept: 'SCA (Software Composition Analysis) — scans package manifests for CVEs in open-source dependencies.',
        threat: 'Supply chain exploit via vulnerable library. Example: Log4Shell (CVE-2021-44228) via log4j-core <2.15.0 in any Java app.',
        howItWorks: 'Reads the package manifest. Resolves the full dep tree including transitive (indirect) deps. Matches each version against OSV/NVD vulnerability database.',
        outputMeaning: 'SARIF to GitHub Security tab. Each finding: CVE ID, severity (CRITICAL/HIGH/MEDIUM/LOW), package, installed version, fixed version.',
        whyOrder: 'Parallel with S3/S3b/S4/S5. No image needed — scans manifests only. Blocks build on CRITICAL/HIGH.',
        commonMistakes: 'Threshold CRITICAL-only (HIGH CVEs like Log4Shell are exploited daily) | No Dependabot/Renovate (CVE count grows silently) | Not scanning transitive deps'
      },
      {
        id: 's3', badge: 'S3', phase: 'ph-s',
        title: 'SAST — Static Analysis',
        tool: 'semgrep==' + TV.semgrepVersion,
        invariants: ['I-4'],
        actor: 'CI runner', trigger: 'Parallel with other security scans',
        filesRead: 'Source code',
        filesProduces: 'SARIF → GitHub Security tab',
        onFailure: 'PR blocked. OWASP Top-10 pattern detected.',
        orderAfter: 'Parallel with S2/S3b/S4/S5', orderBefore: 'All must pass before build.',
        yamlKey: 'genS3',
        concept: 'SAST (Static Application Security Testing) — reads source code to find security bug patterns without running it.',
        threat: 'SQL injection, XSS, command injection, hardcoded credentials, insecure deserialization — OWASP Top 10 patterns.',
        howItWorks: 'Parses code into an AST (Abstract Syntax Tree). Applies pattern rules. Example rule: user input flowing directly into SQL query without parameterization.',
        outputMeaning: 'SARIF report. Each finding: rule ID, severity, file:line, match reason. High confidence = confirmed bug.',
        whyOrder: 'Parallel with S2/S3b/S4/S5. Source code only — no build needed. Fast (~2min).',
        commonMistakes: 'Default rules only (add --config=p/security-audit for deeper scan) | Ignoring medium-confidence findings | Missing framework-specific rule packs'
      },
      {
        id: 's3b', badge: 'S3b', phase: 'ph-s',
        title: 'SCA — License Compliance',
        tool: TV.fossaAction + ' · FOSSA',
        invariants: [],
        actor: 'CI runner', trigger: 'Parallel with other security scans',
        filesRead: 'package.json/go.mod/pom.xml',
        filesProduces: 'License report → FOSSA dashboard',
        onFailure: 'PR blocked if GPL/AGPL detected in commercial project.',
        orderAfter: 'Parallel with S2/S3/S4/S5', orderBefore: 'All must pass before build.',
        yamlKey: 'genS3b',
        concept: 'SCA-License — detects open-source license types in your dep tree that conflict with commercial use.',
        threat: 'GPL/AGPL contamination. Distributing GPL code in a commercial product may legally require open-sourcing your product.',
        howItWorks: 'FOSSA resolves the full dep tree and checks each dep\'s SPDX license ID against a user-defined policy.',
        outputMeaning: 'FOSSA dashboard report. Each dep: SPDX license ID, allowed/flagged/blocked status.',
        whyOrder: 'Parallel with security scans. No build needed. Blocks build before any GPL code enters the artifact.',
        commonMistakes: 'No policy configured in FOSSA | Only scanning direct deps | Ignoring "unknown" license entries'
      },
      {
        id: 's4', badge: 'S4', phase: 'ph-s',
        title: 'IaC Scan',
        tool: TV.checkovAction,
        invariants: ['I-5', 'I-11', 'I-13'],
        actor: 'CI runner', trigger: 'Parallel with other security scans',
        filesRead: 'Dockerfile · K8s manifests · workflow YAML',
        filesProduces: 'SARIF → GitHub Security tab',
        onFailure: 'PR blocked. Privileged container, :latest tag, or unapproved base image detected.',
        orderAfter: 'Parallel with S2/S3/S3b/S5', orderBefore: 'All must pass before build.',
        yamlKey: 'genS4',
        concept: 'IaC (Infrastructure-as-Code) scan — finds security misconfigurations in Dockerfile, Kubernetes YAML, Terraform.',
        threat: 'Containers running as root, hostPath mounts, :latest image tags, privileged containers.',
        howItWorks: 'Checkov reads every IaC file and applies ~2000 built-in rules mapped to CIS benchmarks.',
        outputMeaning: 'SARIF report. Each finding: check ID (e.g., CKV_DOCKER_3), severity, file, line, what to fix.',
        whyOrder: 'Parallel. IaC files are small — fast check. Catches Dockerfile errors before build.',
        commonMistakes: 'Not scanning workflow YAML | Skipping K8s manifests | --skip-check on high-severity findings'
      },
      {
        id: 's5', badge: 'S5', phase: 'ph-s',
        title: 'Secret Scan',
        tool: TV.gitleaksAction,
        invariants: ['I-6'],
        actor: 'CI runner', trigger: 'Parallel with other security scans',
        filesRead: 'Full git history (fetch-depth: 0)',
        filesProduces: 'Pass/fail',
        onFailure: 'PR blocked. Secret pattern found in commit history.',
        orderAfter: 'Parallel with S2/S3/S3b/S4', orderBefore: 'All must pass before build.',
        yamlKey: 'genS5',
        concept: 'Scans full git commit history for credentials, API keys, private keys committed accidentally.',
        threat: 'Exposed credentials in git history. Attacker reads secrets from any commit even if deleted later.',
        howItWorks: 'Gitleaks scans every commit using regex patterns for 150+ known secret formats. fetch-depth:0 is required.',
        outputMeaning: 'Pass: no secrets found. Fail: file path + commit SHA + line number + matched rule name.',
        whyOrder: 'Parallel. Must use fetch-depth:0 for full history. Blocking — a leaked secret in any commit is critical.',
        commonMistakes: 'Default fetch-depth:1 (scans HEAD only) | No rotation runbook | .gitleaksignore without expiry review'
      }
    ]
  },
  {
    id: 's6pr', badge: 'S6', phase: 'ph-b',
    title: 'Docker Build (no push)',
    tool: TV.dockerBuildPush + ' · push=false · tarball output',
    invariants: ['I-7', 'I-12'],
    actor: 'CI runner',
    trigger: 'After all security scans pass (needs: [security])',
    filesRead: 'Dockerfile · source code',
    filesProduces: '/tmp/image.tar (artifact, 1-day retention)',
    onFailure: 'PR cannot merge. Dockerfile or build config has errors.',
    orderAfter: 'Runs after S2-S5 all pass.',
    orderBefore: 'Runs before SBOM generation and scan.',
    yamlKey: 'genS6PR',
    concept: 'Builds the Docker image to verify the Dockerfile is valid. Output is a local tarball — never pushed to registry.',
    threat: 'Broken Dockerfile reaching main pipeline.',
    howItWorks: 'docker/build-push-action with push=false outputs the image as a .tar file. The tarball is uploaded as a CI artifact.',
    outputMeaning: '/tmp/image.tar artifact + image digest output.',
    whyOrder: 'After all security scans pass. Building before scans wastes compute.',
    commonMistakes: 'Pushing to registry in PR pipeline | Not exporting the image digest | Using --build-arg for secrets'
  },
  {
    id: 's8apr', badge: 'S8a', phase: 'ph-g',
    title: 'SBOM Generation (no attest)',
    tool: TV.sbomAction + ' · Syft · SPDX-JSON',
    invariants: ['I-8'],
    actor: 'CI runner',
    trigger: 'After Docker Build succeeds (needs: [build])',
    filesRead: 'Image tarball from S6',
    filesProduces: 'sbom.spdx.json (upload artifact)',
    onFailure: 'PR blocked. SBOM generation failure prevents container scan.',
    orderAfter: 'Runs after Docker Build (S6).',
    orderBefore: 'Runs before container scan (S7).',
    yamlKey: 'genS8aPR',
    concept: 'SBOM (Software Bill of Materials) = a machine-readable inventory of every library, OS package, and dep inside the container image.',
    threat: 'Unknown component composition. Without an SBOM you cannot answer "does this image contain log4j?" after a zero-day.',
    howItWorks: 'Syft reads the image tarball, walks every layer, identifies packages. Output: SPDX-JSON (ISO standard SBOM format).',
    outputMeaning: 'sbom.spdx.json: list of all components. Each entry: name, version, PURL, license.',
    whyOrder: 'After Docker Build. Before container scan. SBOM and scan must reference the same image digest.',
    commonMistakes: 'Not attesting SBOM to registry | SPDX text format (use SPDX-JSON) | Running parallel with build'
  },
  {
    id: 's7pr', badge: 'S7', phase: 'ph-g',
    title: 'Container Vulnerability Scan',
    tool: TV.trivyAction + ' · local tarball',
    invariants: ['I-7', 'I-19'],
    actor: 'CI runner',
    trigger: 'After SBOM generation (needs: [sbom-gen])',
    filesRead: 'Image tarball + .trivyignore',
    filesProduces: 'trivy.sarif → GitHub Security tab',
    onFailure: 'PR cannot merge. CRITICAL/HIGH CVE found.',
    orderAfter: 'Runs after SBOM generation (S8a).',
    orderBefore: 'Last stage in PR pipeline.',
    yamlKey: 'genS7PR',
    concept: 'Scans the built container image for OS-level and library-level CVEs using Trivy.',
    threat: 'Shipping a container with an exploitable CVE.',
    howItWorks: 'Trivy extracts all packages from every image layer. Matches versions against NVD, OSV, GitHub Advisory.',
    outputMeaning: 'SARIF to GitHub Security tab. Each finding: CVE ID, severity, package, installed version, fixed version.',
    whyOrder: 'After SBOM generation. Last stage in PR pipeline.',
    commonMistakes: '.trivyignore entries without expiry date | exit-code:0 (must be 1 to actually block) | Stale Trivy DB cache'
  }
];

// ── Phase 3 — Main Build ──────────────────────────────────────────────────────

export const MAIN_STAGES: PipelineItem[] = [
  {
    id: 's0', badge: 'S0', phase: 'ph-f',
    title: 'Auth + Registry Login',
    tool: 'CI OIDC · ' + TV.dockerLogin,
    invariants: ['I-1', 'I-18'],
    actor: 'CI runner',
    trigger: 'First job — on every push to main',
    filesRead: 'CI OIDC token (auto-generated, ~1hr TTL)',
    filesProduces: 'Registry credentials (ephemeral)',
    onFailure: 'Pipeline stops. Check OIDC role/token configuration.',
    orderAfter: 'First stage.',
    orderBefore: 'Must complete before build job.',
    yamlKey: 'genS0',
    concept: 'OIDC (OpenID Connect) login — authenticates to the container registry using a short-lived CI identity token. No stored password.',
    threat: 'Stored credentials have slow rotation lag, can leak in logs, and have overly broad permissions.',
    howItWorks: 'CI runner requests an OIDC token. Token is signed, short-lived (~1hr TTL). Registry IAM policy trusts this token for the specific workflow/branch combination.',
    outputMeaning: 'Registry credentials set as environment variables. No artifact, no log output.',
    whyOrder: 'First stage. All build/push stages need registry credentials.',
    commonMistakes: 'Not restricting IAM role to specific repo+branch | Docker Hub: no OIDC support | Not masking AWS account ID in ECR setup'
  },
  {
    id: 's1main', badge: 'S1', phase: 'ph-f',
    title: 'Pre-commit Hooks',
    tool: 'pre-commit (re-run on main)',
    invariants: ['I-2'],
    actor: 'CI runner',
    trigger: 'After setup (parallel with security scans)',
    filesRead: '.pre-commit-config.yaml',
    filesProduces: 'Pass/fail',
    onFailure: 'Main pipeline stops. Catches --no-verify bypasses.',
    orderAfter: 'Parallel with security scans.',
    orderBefore: 'Before Docker Build.',
    yamlKey: 'genS1',
    concept: 'Same hooks as PR S1 re-run on main. Catches developer --no-verify bypasses.',
    threat: 'Local hook bypass via --no-verify silently shipping bad code to main.',
    howItWorks: 'pre-commit framework runs every hook against every file. Exit non-zero blocks the build.',
    outputMeaning: 'Pass: every hook returned 0. Fail: hook name + file + line printed.',
    whyOrder: 'First stage on main, parallel with security scans.',
    commonMistakes: 'Skipping the re-run on main | autoupdate without review'
  },
  {
    id: 'parallel-main', parallel: true,
    stages: [
      {
        id: 's2m', badge: 'S2', phase: 'ph-s',
        title: 'SCA — Dep Vulnerability',
        tool: TV.dependencyReview,
        invariants: ['I-3'],
        actor: 'CI runner', trigger: 'Parallel with other scans on main',
        filesRead: 'package files', filesProduces: 'SARIF',
        onFailure: 'Pipeline stops. CVE blocks signed image creation.',
        orderAfter: 'Parallel with S3m/S3bm/S4m/S5m', orderBefore: 'Before build (S6).',
        yamlKey: 'genS2',
        concept: 'SCA — scans manifests against CVE DBs.',
        threat: 'Vulnerable dep ships to prod. Log4Shell-class incident.',
        howItWorks: 'Reads manifest. Resolves transitive deps. Matches versions against OSV + NVD.',
        outputMeaning: 'SARIF upload to GitHub Security. Severity + fixed-version per CVE.',
        whyOrder: 'Parallel — no image needed.',
        commonMistakes: 'Threshold CRITICAL-only | No auto-update tooling | Skipping transitive scan'
      },
      {
        id: 's3m', badge: 'S3', phase: 'ph-s',
        title: 'SAST — Static Analysis',
        tool: 'semgrep',
        invariants: ['I-4'],
        actor: 'CI runner', trigger: 'Parallel with other scans on main',
        filesRead: 'Source code', filesProduces: 'SARIF',
        onFailure: 'Pipeline stops. OWASP Top-10 hit blocks merge to image.',
        orderAfter: 'Parallel', orderBefore: 'Before build (S6).',
        yamlKey: 'genS3',
        concept: 'SAST — pattern scan on source code AST.',
        threat: 'SQLi, XSS, command injection ship to prod.',
        howItWorks: 'Parses source into AST. Applies rule packs. Reports matches with file:line.',
        outputMeaning: 'SARIF. Each finding: rule + severity + confidence + match.',
        whyOrder: 'Parallel.',
        commonMistakes: 'Default rule pack only | Ignoring medium-confidence | Missing framework-specific packs'
      },
      {
        id: 's3bm', badge: 'S3b', phase: 'ph-s',
        title: 'SCA — License',
        tool: TV.fossaAction,
        invariants: [],
        actor: 'CI runner', trigger: 'Parallel with other scans on main',
        filesRead: 'package files', filesProduces: 'License report',
        onFailure: 'Pipeline stops if GPL detected in commercial code path.',
        orderAfter: 'Parallel', orderBefore: 'Before build (S6).',
        yamlKey: 'genS3b',
        concept: 'License scan — detect GPL/AGPL contamination.',
        threat: 'Distribution of GPL code without source disclosure.',
        howItWorks: 'Resolves deps. Maps each to SPDX license ID. Checks against policy.',
        outputMeaning: 'Pass/fail per policy. Per-dep license summary.',
        whyOrder: 'Parallel.',
        commonMistakes: 'No policy configured | Only direct deps scanned | Ignoring "unknown" entries'
      },
      {
        id: 's4m', badge: 'S4', phase: 'ph-s',
        title: 'IaC Scan',
        tool: TV.checkovAction,
        invariants: ['I-5', 'I-11', 'I-13'],
        actor: 'CI runner', trigger: 'Parallel with other scans on main',
        filesRead: 'Dockerfile + K8s manifests', filesProduces: 'SARIF',
        onFailure: 'Pipeline stops on privileged container, :latest, or hostPath finding.',
        orderAfter: 'Parallel', orderBefore: 'Before build (S6).',
        yamlKey: 'genS4',
        concept: 'IaC scan — Dockerfile + K8s + Terraform misconfigurations.',
        threat: 'Privileged pods, hostPath mounts, :latest images.',
        howItWorks: 'Checkov runs ~2000 rules across CIS benchmarks.',
        outputMeaning: 'SARIF. Each finding: check ID + severity + remediation.',
        whyOrder: 'Parallel. Fast.',
        commonMistakes: 'Not scanning workflow YAML | --skip-check on high-severity | Missing K8s manifests'
      },
      {
        id: 's5m', badge: 'S5', phase: 'ph-s',
        title: 'Secret Scan',
        tool: TV.gitleaksAction,
        invariants: ['I-6'],
        actor: 'CI runner', trigger: 'Parallel with other scans on main',
        filesRead: 'Full git history', filesProduces: 'Pass/fail',
        onFailure: 'Pipeline stops on secret in any commit.',
        orderAfter: 'Parallel', orderBefore: 'Before build (S6).',
        yamlKey: 'genS5',
        concept: 'Secret scan — full git history regex against 150+ patterns.',
        threat: 'Leaked AWS/GitHub/Stripe tokens, private keys in any commit.',
        howItWorks: 'Gitleaks scans every commit. Requires fetch-depth:0 for full history.',
        outputMeaning: 'Path + commit SHA + line + rule on finding.',
        whyOrder: 'Parallel. Full history fetch.',
        commonMistakes: 'fetch-depth:1 (only HEAD) | No rotation runbook | .gitleaksignore without expiry'
      }
    ]
  },
  {
    id: 's6main', badge: 'S6', phase: 'ph-b',
    title: 'Docker Build + Push',
    tool: TV.dockerBuildPush + ' · multi-arch · push=true',
    invariants: ['I-7', 'I-12'],
    actor: 'CI runner',
    trigger: 'After hooks + security all pass',
    filesRead: 'Dockerfile · source code',
    filesProduces: 'Image in registry (SHA tag) · image-digest · image-ref outputs',
    onFailure: 'Pipeline stops. No image in registry.',
    orderAfter: 'All security scans (S2-S5) and hooks (S1) must pass first.',
    orderBefore: 'SBOM, scan, signing, tests all need the pushed image.',
    yamlKey: 'genS6Main',
    concept: 'Builds the production image and pushes it to registry, tagged with the git commit SHA for immutability.',
    threat: 'Mutable :latest tags causing non-deterministic deploys.',
    howItWorks: 'docker/build-push-action with push=true. Multi-arch build (linux/amd64, linux/arm64) via QEMU emulation and buildx.',
    outputMeaning: 'Image in registry at REGISTRY/IMAGE:SHA. Outputs: image-digest (sha256:...), image-ref (full reference).',
    whyOrder: 'After all security scans. SBOM, sign, test, DAST all need the pushed image.',
    commonMistakes: 'Pushing :latest as primary tag | Not capturing image-digest output | Single-arch build'
  },
  {
    id: 's8a', badge: 'S8a', phase: 'ph-g',
    title: 'SBOM Generation',
    tool: TV.sbomAction + ' · Syft · SPDX-JSON',
    invariants: ['I-8'],
    actor: 'CI runner',
    trigger: 'After Docker Build (needs: [build])',
    filesRead: 'Image in registry (by digest)',
    filesProduces: 'sbom.spdx.json artifact',
    onFailure: 'Pipeline stops. Container scan cannot proceed without SBOM.',
    orderAfter: 'Immediately after Docker Build.',
    orderBefore: 'Before container vulnerability scan.',
    yamlKey: 'genS8a',
    concept: 'Generates SBOM from the pushed registry image and prepares it for cryptographic attestation.',
    threat: 'Unknown composition. This SBOM will be permanently attached to the production image via cosign attestation.',
    howItWorks: 'Syft pulls the image from registry by digest. Generates SPDX-JSON SBOM.',
    outputMeaning: 'sbom.spdx.json artifact. Attached to registry image by S8b as a cosign attestation.',
    whyOrder: 'Immediately after Docker Build. Must complete before S8b and S7.',
    commonMistakes: 'Using image tag instead of digest | Running in parallel with S7 without needs: gate'
  },
  {
    id: 's7main', badge: 'S7', phase: 'ph-g',
    title: 'Container Vulnerability Scan',
    tool: TV.trivyAction + ' · registry image',
    invariants: ['I-7', 'I-19'],
    actor: 'CI runner',
    trigger: 'After SBOM generation (needs: [sbom-gen])',
    filesRead: 'Image in registry + .trivyignore',
    filesProduces: 'trivy.sarif → GitHub Security tab',
    onFailure: 'Pipeline stops. CRITICAL/HIGH CVE found.',
    orderAfter: 'After SBOM generation (S8a).',
    orderBefore: 'Before image signing (S8b). Never sign before scanning.',
    yamlKey: 'genS7Main',
    concept: 'Final CVE scan against the pushed registry image before signing.',
    threat: 'Critical invariant: never sign a vulnerable image.',
    howItWorks: 'Trivy scans the registry image by digest. Same database, same rules as PR.',
    outputMeaning: 'Same SARIF format as PR scan. Pipeline exits on CRITICAL/HIGH unless suppressed with valid expiry.',
    whyOrder: 'After SBOM generation. Before image signing (S8b). The ordering S8a → S7 → S8b is a hard pipeline invariant.',
    commonMistakes: 'Running S8b before S7 (signs before scanning — violates invariant) | Different scan result from PR'
  },
  {
    id: 's8b', badge: 'S8b', phase: 'ph-g',
    title: 'Image Signing + SBOM Attestation',
    tool: TV.cosignInstaller + ' · keyless OIDC · Rekor',
    invariants: ['I-8'],
    actor: 'CI runner (needs id-token: write)',
    trigger: 'After container scan passes (needs: [scan, build])',
    filesRead: 'sbom.spdx.json artifact · image digest from build',
    filesProduces: 'Cosign signature in registry · SBOM attestation · Rekor entry',
    onFailure: 'Pipeline stops. Image reaches registry unsigned. Kyverno ClusterPolicy blocks pod admission.',
    orderAfter: 'After container scan passes. Never sign before scanning.',
    orderBefore: 'Before SLSA provenance.',
    yamlKey: 'genS8b',
    concept: 'Signs the container image and attaches the SBOM as a cryptographic attestation using Sigstore/cosign.',
    threat: 'Unsigned images cannot be verified at deploy time.',
    howItWorks: 'cosign uses keyless signing (Sigstore OIDC — no private key stored anywhere). Entry recorded in Rekor (a public transparency log — append-only, immutable).',
    outputMeaning: 'Cosign signature in registry (.sig suffix). SBOM attestation (.att suffix). Rekor entry.',
    whyOrder: 'After container scan passes. Never sign before scanning.',
    commonMistakes: 'Missing id-token:write permission | Not downloading SBOM artifact from S8a | Not verifying signature after signing'
  },
  {
    id: 's9', badge: 'S9', phase: 'ph-g',
    title: 'Test Suite',
    tool: 'Stack-specific test runner · Codecov',
    invariants: ['I-9'],
    actor: 'CI runner',
    trigger: 'After Docker Build (parallel with SBOM/scan)',
    filesRead: 'Source code · stack package file',
    filesProduces: 'coverage report → Codecov',
    onFailure: 'Pipeline stops. Tests must pass before DAST.',
    orderAfter: 'After Docker Build. Parallel with SBOM/scan.',
    orderBefore: 'Before DAST.',
    yamlKey: 'genS9',
    concept: 'Runs the application test suite to verify correctness and measure code coverage.',
    threat: 'Broken functionality reaching production. Coverage decreasing below threshold (I-9).',
    howItWorks: 'Stack-specific test runner runs all tests. Coverage report uploaded to Codecov. I-9: if coverage decreases vs. base branch, pipeline fails.',
    outputMeaning: 'Pass/fail with count. Coverage percentage and diff vs. base branch on Codecov.',
    whyOrder: 'After Docker Build. Before DAST — DAST on a broken app produces meaningless results.',
    commonMistakes: 'No coverage threshold | Running DAST before tests pass | Not uploading coverage report'
  },
  {
    id: 's9a', badge: 'S9a', phase: 'ph-g',
    title: 'Integration Tests',
    tool: 'docker compose · k3d',
    invariants: ['I-9'],
    actor: 'CI runner',
    trigger: 'After test suite passes (needs: [test])',
    filesRead: 'Built image · docker-compose.test.yml',
    filesProduces: 'Test results',
    onFailure: 'Pipeline stops. Check service integration.',
    orderAfter: 'After unit test suite passes.',
    orderBefore: 'Before DAST.',
    yamlKey: 'genS9a',
    concept: 'Runs tests against a locally-started full application stack to verify service integration.',
    threat: 'Unit tests pass but service integration fails.',
    howItWorks: 'docker compose brings up all services. Tests run against the composed stack via HTTP.',
    outputMeaning: 'Test pass/fail per test case.',
    whyOrder: 'After unit tests (S9). Before DAST.',
    commonMistakes: 'Using production database credentials | Not seeding test data | Not running docker compose down on exit'
  },
  {
    id: 'dast', badge: 'DAST', phase: 'ph-g',
    title: 'DAST — Dynamic App Security',
    tool: TV.zapBaseline + ' · OWASP ZAP',
    invariants: [],
    actor: 'CI runner',
    trigger: 'After integration tests pass (needs: [integration-test])',
    filesRead: 'Running container from registry',
    filesProduces: 'ZAP report · SARIF',
    onFailure: 'Pipeline stops. Check ZAP report for active findings.',
    orderAfter: 'After tests pass.',
    orderBefore: 'Before SLSA and promotion.',
    yamlKey: 'genDAST',
    concept: 'DAST (Dynamic Application Security Testing) — an automated scanner that attacks your running application like an external attacker.',
    threat: 'XSS, SQL injection, CSRF, authentication bypasses — vulnerabilities that static analysis misses.',
    howItWorks: 'OWASP ZAP (Zed Attack Proxy) starts a proxy, spiders every endpoint, then sends attack payloads.',
    outputMeaning: 'ZAP HTML report + SARIF. Each finding: URL, attack type, risk level, evidence.',
    whyOrder: 'After integration tests (app must be working). Last security check before SLSA.',
    commonMistakes: 'Running before tests pass | Not excluding /health endpoints | Baseline scan only'
  },
  {
    id: 's11', badge: 'S11', phase: 'ph-g',
    title: 'Performance Tests',
    tool: 'k6 · ' + TV.k6Action,
    invariants: [],
    actor: 'CI runner',
    trigger: 'After DAST passes (parallel or sequential)',
    filesRead: 'k6 test scripts · running container',
    filesProduces: 'k6 performance report',
    onFailure: 'Pipeline stops if p95 latency exceeds threshold.',
    orderAfter: 'After integration tests.',
    orderBefore: 'Before promotion.',
    yamlKey: 'genS11',
    concept: 'Runs load tests against the running application to detect latency regressions and throughput limits.',
    threat: 'Latency regression merging silently.',
    howItWorks: 'k6 simulates virtual users making requests. Measures p50/p95/p99 latency, error rate, throughput.',
    outputMeaning: 'k6 summary: p95/p99 latency in ms, requests/second, error rate %. Threshold breach = pipeline fails.',
    whyOrder: 'After integration tests. Can run parallel with DAST.',
    commonMistakes: 'No threshold assertions | No warm-up period | Testing against production'
  },
  {
    id: 's10', badge: 'S10', phase: 'ph-g',
    title: 'SLSA Level 3 Provenance',
    tool: TV.slsaGenerator,
    invariants: ['I-10'],
    actor: 'Separate isolated CI job',
    trigger: 'After scan and build complete (needs: [scan, build])',
    ciLimitation: '⚠️ SLSA Level 3 generator is GitHub Actions only. GitLab CI, Jenkins, Azure DevOps, CircleCI, and Tekton show a placeholder — they achieve at most SLSA Level 2.',
    filesRead: 'Image digest from build outputs',
    filesProduces: 'slsa-provenance.intoto.jsonl · provenance attestation in registry',
    onFailure: 'Pipeline fails. I-10 requires SLSA Level 3 provenance on every prod image.',
    orderAfter: 'After build and scan. Isolated job required for Level 3.',
    orderBefore: 'Before notification.',
    yamlKey: 'genS10',
    concept: 'SLSA Level 3 provenance = a signed attestation of exactly how the image was built.',
    threat: 'Build process tampering. Attacker modifies the CI build environment to inject malicious code.',
    howItWorks: 'slsa-github-generator runs as a SEPARATE, ISOLATED job (required for Level 3). Generates a provenance attestation signed by Sigstore.',
    outputMeaning: 'slsa-provenance.intoto.jsonl artifact + provenance attestation in registry.',
    whyOrder: 'After build and scan. Must be an isolated job for Level 3.',
    commonMistakes: 'Running as a step inside the build job (max SLSA Level 2) | Not capturing image-digest | Missing permissions'
  },
  {
    id: 's12', badge: 'S12', phase: 'ph-o',
    title: 'Build Notification',
    tool: TV.slackAction,
    invariants: [],
    actor: 'CI runner',
    trigger: 'After all jobs complete (if: always())',
    filesRead: 'Job status from previous jobs',
    filesProduces: 'Slack message in #deployments or #alerts',
    onFailure: 'Non-critical. Notification failure does not block.',
    orderAfter: 'After sign, test, DAST, provenance complete.',
    orderBefore: 'Before promotion.',
    yamlKey: 'genS12',
    concept: 'Sends pipeline result to a Slack channel regardless of pass/fail using if: always().',
    threat: 'Silent pipeline failure. Team discovers broken build hours later.',
    howItWorks: 'slackapi/slack-github-action sends a message with pipeline status, commit SHA, actor, and links to failed jobs.',
    outputMeaning: 'Slack message in #deployments. Green badge = all passed. Red badge = failure with direct link.',
    whyOrder: 'After all pipeline jobs complete. Non-blocking.',
    commonMistakes: 'Missing if: always() | SLACK_BOT_TOKEN not in secrets | No direct link to failing job'
  },
  {
    id: 's13', badge: 'S13', phase: 'ph-o',
    title: 'Promote to :latest',
    tool: 'docker buildx imagetools create · re-tag only',
    invariants: [],
    actor: 'CI runner',
    trigger: 'After notify, if no failures',
    filesRead: 'Image digest from build',
    filesProduces: ':latest tag in registry (same digest as :SHA)',
    onFailure: 'Non-critical for current deploy. :latest not updated.',
    orderAfter: 'After notification. Only if pipeline passed.',
    orderBefore: 'Before signature verification.',
    yamlKey: 'genS13',
    concept: 'Re-tags the verified, signed image as :latest without rebuilding — same digest, new tag only.',
    threat: ':latest tag pointing to an unverified image.',
    howItWorks: 'docker buildx imagetools create re-tags the existing digest as :latest. No new image layers created.',
    outputMeaning: ':latest tag in registry pointing to the same digest as :SHA.',
    whyOrder: 'After notification. Only if all prior jobs passed — no if: always() on this step.',
    commonMistakes: 'Using if: always() here | Rebuilding instead of re-tagging | Not referencing by digest'
  }
];

// ── Phase 4 — Promotions ──────────────────────────────────────────────────────

export const PROMOTION_STAGES: StageDef[] = [
  {
    id: 'p1', badge: 'P1', phase: 'ph-o',
    title: 'Deploy to dev',
    tool: 'ArgoCD / Flux (GitOps pull)',
    invariants: ['I-16'],
    actor: 'CD controller in cluster',
    trigger: 'Merge to main + signed image in registry',
    filesRead: 'K8s manifest pinned to image digest',
    filesProduces: 'Running pods in dev namespace',
    onFailure: 'Pipeline stops. ArgoCD sync rolls back.',
    orderAfter: 'After S14 (signature verification) passes.',
    orderBefore: 'Before promote to test.',
    yamlKey: 'genP1',
    concept: 'CD tool pulls the signed image into the dev cluster by digest, not by tag.',
    threat: 'Wrong image deployed because tag moved. Digest pinning prevents this.',
    howItWorks: 'GitOps controller reads K8s manifest from a config repo. Manifest references image by sha256 digest. Argo PreSync hook runs cosign verify before pods start.',
    outputMeaning: 'Pods in Ready state in dev namespace. /health returns 200 within 60s.',
    whyOrder: 'First environment hop after build. Smoke test gates promotion to test env.',
    commonMistakes: 'Pinning by tag instead of digest | Skipping PreSync cosign verify | No smoke test gate',
    failureClass: 'STOPS_PIPELINE'
  },
  {
    id: 'p2', badge: 'P2', phase: 'ph-o',
    title: 'Promote to test',
    tool: 'GitOps PR — bump image digest in test overlay',
    invariants: ['I-16'],
    actor: 'CD controller + automated test runner',
    trigger: 'Dev smoke test passes',
    filesRead: 'Test overlay manifest',
    filesProduces: 'Running pods in test namespace + regression report',
    onFailure: 'Pipeline stops. Regression suite failure blocks staging promotion.',
    orderAfter: 'After P1 dev smoke test passes.',
    orderBefore: 'Before promote to staging.',
    yamlKey: 'genP2',
    concept: 'Same image bytes retagged into the test overlay. No rebuild.',
    threat: 'Rebuilding per environment produces different images. Tests prove nothing about prod.',
    howItWorks: 'A bot opens a PR bumping the digest in the test overlay manifest. PR merge triggers GitOps sync.',
    outputMeaning: 'Test report — pass/fail per test case. JUnit XML uploaded.',
    whyOrder: 'After dev smoke. Before staging. Same image throughout.',
    commonMistakes: 'Rebuilding for test config | Pointing tests at prod DB | Manual digest copy (typo risk)',
    failureClass: 'STOPS_PIPELINE'
  },
  {
    id: 'p3', badge: 'P3', phase: 'ph-o',
    title: 'Promote to staging',
    tool: 'GitOps PR — bump image digest in staging overlay',
    invariants: ['I-16'],
    actor: 'CD controller + k6 + manual UAT reviewer',
    trigger: 'Test regression suite passes',
    filesRead: 'Staging overlay manifest · k6 performance scripts',
    filesProduces: 'k6 report · UAT sign-off record',
    onFailure: 'Pipeline stops. p95 > 500ms or UAT rejection blocks prod.',
    orderAfter: 'After P2 test passes.',
    orderBefore: 'Before P4 production promotion.',
    yamlKey: 'genP3',
    concept: 'Staging mirrors prod config exactly. Last validation before customer traffic.',
    threat: 'Staging diverges from prod. Bug seen in prod that staging never reproduced.',
    howItWorks: 'Same image digest deployed to staging. k6 runs load test. Designated UAT reviewer must approve in PR.',
    outputMeaning: 'k6 summary report. UAT approval comment on PR. Both required.',
    whyOrder: 'After test. Before prod. Performance + UAT gates here.',
    commonMistakes: 'Staging config drifts from prod | k6 with no threshold | UAT optional',
    failureClass: 'STOPS_PIPELINE'
  },
  {
    id: 'p4', badge: 'P4', phase: 'ph-o',
    title: 'Canary to prod (5% → 100%)',
    tool: 'Argo Rollouts / Flagger',
    invariants: ['I-16', 'I-20'],
    actor: 'Canary controller + Prometheus error-rate watcher',
    trigger: 'P3 staging approval gate passed + required reviewer approves prod PR',
    filesRead: 'Prod overlay manifest · Prometheus error-rate query',
    filesProduces: 'Live prod pods serving 5% then 100% traffic',
    onFailure: 'Auto-rollback. Traffic shifts back to previous stable digest within 30s.',
    orderAfter: 'After P3 staging gate.',
    orderBefore: 'After P4 + 60min stable → next pipeline run can proceed.',
    yamlKey: 'genP4',
    concept: 'Gradual traffic shift to new version. Watches error rate. Auto-rollback if breached.',
    threat: 'New image works in staging but breaks prod under real load.',
    howItWorks: 'Argo Rollouts splits traffic via service mesh. Step 1: 5% canary. Step 2: hold 5 min. Step 3: watch Prometheus error_rate. Step 4: if >0.5% → rollback. Step 5: else ramp to 100%.',
    outputMeaning: 'Per-step traffic %. Error rate at each step. Final: 100% on new version or rolled back.',
    whyOrder: 'Last promotion step. Customer-facing.',
    commonMistakes: 'No SLI defined | Skipping the 5% hold | Manual rollback only',
    failureClass: 'STOPS_PIPELINE'
  },
  {
    id: 's14', badge: 'S14', phase: 'ph-v',
    title: 'Signature Verification',
    tool: TV.cosignInstaller + ' · cosign verify',
    invariants: ['I-8', 'I-16', 'I-20'],
    actor: 'CI runner + Kyverno at K8s admission',
    trigger: 'After promote completes (needs: [promote, build])',
    filesRead: 'Signature and attestation in registry',
    filesProduces: 'Verification output — fails pipeline if invalid',
    onFailure: 'Pipeline fails. Image must not be deployed.',
    orderAfter: 'After promotion.',
    orderBefore: 'Last stage. Final gate.',
    yamlKey: 'genS14',
    concept: 'Final verification step — confirms the cosign signature on the pushed image is cryptographically valid.',
    threat: 'Signing failure that went undetected. An unsigned image that passes all prior gates.',
    howItWorks: 'cosign verify checks the signature against the expected OIDC issuer and subject. Same check runs at K8s admission via Kyverno.',
    outputMeaning: 'Pass: verified. Fail: signature missing or issuer/subject mismatch.',
    whyOrder: 'Final stage. After promote.',
    commonMistakes: 'Too-broad --certificate-identity-regexp | No Kyverno policy in cluster | Different subject in verify vs sign step'
  }
];

// ── Flat lookup map (all phases) ──────────────────────────────────────────────

function flatten(items: PipelineItem[]): StageDef[] {
  const out: StageDef[] = [];
  for (const item of items) {
    if (isParallel(item)) out.push(...item.stages);
    else out.push(item);
  }
  return out;
}

export const ALL_STAGES_FLAT: Record<StageId, StageDef> = Object.fromEntries(
  [
    ...flatten(PR_STAGES),
    ...flatten(MAIN_STAGES),
    ...PROMOTION_STAGES,
  ].map(s => [s.id, s])
);
