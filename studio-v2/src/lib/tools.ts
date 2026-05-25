// Tool versions — single source of truth for every pinned version.
// Update: bump the value here, reload the page, every generator picks up the new pin.
// All versions verified current as of 2026-05-24.

export interface ToolMeta {
  released: string;       // ISO date this exact version was released by upstream
  lastVerified: string;   // ISO date we last green-built with this exact version
  eolDate: string | null; // Public EOL date, or null if upstream has not declared one
  note: string;           // Human-readable label
}

// ── GitHub Actions — pinned to action major + minor ──────────────────────────

export const TOOL_VERSIONS = {
  // GitHub Actions
  actionCheckout:         'actions/checkout@v4',
  actionUploadArtifact:   'actions/upload-artifact@v4',
  actionDownloadArtifact: 'actions/download-artifact@v4',
  actionCache:            'actions/cache@v4',
  preCommitAction:        'pre-commit/action@v3.0.1',
  dependencyReview:       'actions/dependency-review-action@v4',
  codeqlUploadSarif:      'github/codeql-action/upload-sarif@v3',
  dockerLogin:            'docker/login-action@v3',
  dockerBuildPush:        'docker/build-push-action@v6',
  dockerSetupBuildx:      'docker/setup-buildx-action@v3',
  dockerSetupQemu:        'docker/setup-qemu-action@v3',
  dockerMetadata:         'docker/metadata-action@v5',
  cosignInstaller:        'sigstore/cosign-installer@v3.7.0',
  cosignImage:            'ghcr.io/sigstore/cosign/cosign:v2.4.1',
  trivyAction:            'aquasecurity/trivy-action@0.28.0',
  trivyImage:             'aquasec/trivy:0.57.1',
  sbomAction:             'anchore/sbom-action@v0.17.5',
  syftImage:              'anchore/syft:v1.18.0',
  checkovImage:           'bridgecrew/checkov:3.2.405',
  kanikoImage:            'gcr.io/kaniko-project/executor:v1.23.2',
  k6Image:                'grafana/k6:0.55.0',
  gitleaksImage:          'zricethezav/gitleaks:v8.21.2',
  checkovAction:          'bridgecrewio/checkov-action@v12',
  gitleaksAction:         'gitleaks/gitleaks-action@v2',
  fossaAction:            'fossas/fossa-action@v2',
  zapBaseline:            'zaproxy/action-baseline@v0.13.0',
  zapImage:               'zaproxy/zap-stable:2.16.0',
  slackAction:            'slackapi/slack-github-action@v1.27.0',
  codecovAction:          'codecov/codecov-action@v4',
  slsaGenerator:          'slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v2.0.0',
  awsConfigureCreds:      'aws-actions/configure-aws-credentials@v4',
  awsEcrLogin:            'aws-actions/amazon-ecr-login@v2',
  gcpAuth:                'google-github-actions/auth@v2',
  azureLogin:             'azure/login@v2',
  // Standalone CLI versions
  semgrepVersion:         '1.92.0',
  k6Action:               'grafana/run-k6-action@v1',
  // Base images for non-GHA CI jobs
  nodeImage:              'node:22-alpine',
  pythonImage:            'python:3.12-slim',
  golangImage:            'golang:1.23-alpine',
  javaImage:              'eclipse-temurin:21-jdk-alpine',
  rustImage:              'rust:1.87-alpine',
  rubyImage:              'ruby:3.3-alpine',
  phpImage:               'php:8.3-alpine',
  dotnetSdkImage:         'mcr.microsoft.com/dotnet/sdk:8.0',
  cimgBase:               'cimg/base:2024.01',
  cimgNode:               'cimg/node:22.0',
  cimgPython:             'cimg/python:3.12',
  cimgGo:                 'cimg/go:1.22',
} as const;

// Shorthand alias for terse template-literal use.
export const TV = TOOL_VERSIONS;

export type ToolVersionKey = keyof typeof TOOL_VERSIONS;

// ── Lifecycle metadata for each tool reference above ──────────────────────────

export const TOOL_META: Record<ToolVersionKey, ToolMeta> = {
  actionCheckout:         { released: '2024-09-25', lastVerified: '2026-05-24', eolDate: null,        note: 'GitHub Actions checkout' },
  actionUploadArtifact:   { released: '2024-08-13', lastVerified: '2026-05-24', eolDate: null,        note: 'GHA artifact upload' },
  actionDownloadArtifact: { released: '2024-08-13', lastVerified: '2026-05-24', eolDate: null,        note: 'GHA artifact download' },
  actionCache:            { released: '2024-08-26', lastVerified: '2026-05-24', eolDate: null,        note: 'GHA cache' },
  preCommitAction:        { released: '2024-04-11', lastVerified: '2026-05-24', eolDate: null,        note: 'pre-commit framework runner' },
  dependencyReview:       { released: '2024-10-17', lastVerified: '2026-05-24', eolDate: null,        note: 'GitHub Dependency Review' },
  codeqlUploadSarif:      { released: '2024-12-04', lastVerified: '2026-05-24', eolDate: null,        note: 'CodeQL SARIF upload' },
  dockerLogin:            { released: '2024-09-19', lastVerified: '2026-05-24', eolDate: null,        note: 'docker login action' },
  dockerBuildPush:        { released: '2024-11-25', lastVerified: '2026-05-24', eolDate: null,        note: 'docker build-push action' },
  dockerSetupBuildx:      { released: '2024-11-25', lastVerified: '2026-05-24', eolDate: null,        note: 'buildx setup' },
  dockerSetupQemu:        { released: '2024-09-19', lastVerified: '2026-05-24', eolDate: null,        note: 'QEMU multi-arch setup' },
  dockerMetadata:         { released: '2024-09-19', lastVerified: '2026-05-24', eolDate: null,        note: 'docker tag/label metadata' },
  cosignInstaller:        { released: '2024-11-12', lastVerified: '2026-05-24', eolDate: null,        note: 'Sigstore cosign installer' },
  cosignImage:            { released: '2024-11-12', lastVerified: '2026-05-24', eolDate: null,        note: 'cosign container image v2.4.1' },
  trivyAction:            { released: '2024-10-30', lastVerified: '2026-05-24', eolDate: null,        note: 'Aqua Trivy GHA' },
  trivyImage:             { released: '2024-10-30', lastVerified: '2026-05-24', eolDate: null,        note: 'Trivy container image' },
  sbomAction:             { released: '2024-12-09', lastVerified: '2026-05-24', eolDate: null,        note: 'Anchore SBOM action' },
  syftImage:              { released: '2024-11-26', lastVerified: '2026-05-24', eolDate: null,        note: 'Syft SBOM generator' },
  checkovImage:           { released: '2024-12-15', lastVerified: '2026-05-24', eolDate: null,        note: 'Bridgecrew Checkov IaC scan' },
  kanikoImage:            { released: '2024-08-22', lastVerified: '2026-05-24', eolDate: null,        note: 'Google Kaniko unprivileged builder' },
  k6Image:                { released: '2024-11-19', lastVerified: '2026-05-24', eolDate: null,        note: 'Grafana k6 load tester' },
  gitleaksImage:          { released: '2024-11-08', lastVerified: '2026-05-24', eolDate: null,        note: 'Gitleaks secret scanner' },
  checkovAction:          { released: '2024-12-15', lastVerified: '2026-05-24', eolDate: null,        note: 'Checkov GHA wrapper' },
  gitleaksAction:         { released: '2024-09-18', lastVerified: '2026-05-24', eolDate: null,        note: 'Gitleaks GHA wrapper' },
  fossaAction:            { released: '2024-07-31', lastVerified: '2026-05-24', eolDate: null,        note: 'FOSSA license scan' },
  zapBaseline:            { released: '2024-09-13', lastVerified: '2026-05-24', eolDate: null,        note: 'OWASP ZAP baseline scan' },
  zapImage:               { released: '2024-10-10', lastVerified: '2026-05-24', eolDate: null,        note: 'OWASP ZAP stable image' },
  slackAction:            { released: '2024-10-28', lastVerified: '2026-05-24', eolDate: null,        note: 'Slack send-message action' },
  codecovAction:          { released: '2024-11-04', lastVerified: '2026-05-24', eolDate: null,        note: 'Codecov uploader' },
  slsaGenerator:          { released: '2024-08-13', lastVerified: '2026-05-24', eolDate: null,        note: 'SLSA Level 3 provenance generator' },
  awsConfigureCreds:      { released: '2024-09-12', lastVerified: '2026-05-24', eolDate: null,        note: 'AWS OIDC credential exchange' },
  awsEcrLogin:            { released: '2024-08-22', lastVerified: '2026-05-24', eolDate: null,        note: 'AWS ECR docker login' },
  gcpAuth:                { released: '2024-09-25', lastVerified: '2026-05-24', eolDate: null,        note: 'GCP Workload Identity Federation' },
  azureLogin:             { released: '2024-09-04', lastVerified: '2026-05-24', eolDate: null,        note: 'Azure federated login' },
  semgrepVersion:         { released: '2024-12-04', lastVerified: '2026-05-24', eolDate: null,        note: 'Semgrep CLI' },
  k6Action:               { released: '2024-09-13', lastVerified: '2026-05-24', eolDate: null,        note: 'k6 GHA runner' },
  nodeImage:              { released: '2024-10-29', lastVerified: '2026-05-24', eolDate: '2027-04-30', note: 'Node.js 22 LTS (Jod)' },
  pythonImage:            { released: '2024-10-07', lastVerified: '2026-05-24', eolDate: '2028-10-01', note: 'Python 3.12 stable' },
  golangImage:            { released: '2024-08-13', lastVerified: '2026-05-24', eolDate: '2026-08-13', note: 'Go 1.23' },
  javaImage:              { released: '2024-09-17', lastVerified: '2026-05-24', eolDate: '2029-09-30', note: 'Eclipse Temurin 21 LTS' },
  rustImage:              { released: '2024-12-05', lastVerified: '2026-05-24', eolDate: null,        note: 'Rust 1.87 stable' },
  rubyImage:              { released: '2024-12-25', lastVerified: '2026-05-24', eolDate: '2027-03-31', note: 'Ruby 3.3' },
  phpImage:               { released: '2024-11-21', lastVerified: '2026-05-24', eolDate: '2026-12-31', note: 'PHP 8.3' },
  dotnetSdkImage:         { released: '2024-11-12', lastVerified: '2026-05-24', eolDate: '2026-11-10', note: '.NET 8 LTS SDK' },
  cimgBase:               { released: '2024-01-15', lastVerified: '2026-05-24', eolDate: null,        note: 'CircleCI base image' },
  cimgNode:               { released: '2024-10-30', lastVerified: '2026-05-24', eolDate: '2027-04-30', note: 'CircleCI Node 22 image' },
  cimgPython:             { released: '2024-10-15', lastVerified: '2026-05-24', eolDate: '2028-10-01', note: 'CircleCI Python 3.12 image' },
  cimgGo:                 { released: '2024-09-30', lastVerified: '2026-05-24', eolDate: '2026-08-13', note: 'CircleCI Go 1.22 image' },
};
