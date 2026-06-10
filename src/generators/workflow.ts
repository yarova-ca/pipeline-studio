// GitHub Actions workflow generator — ported from v1 index.html
// Logic source: lines 5781-6196 (buildWorkflow, buildGHAPRWorkflow, buildGHAMainWorkflow)
// Helper logic: lines 3029-3276 (getScanStepsGHA, getSBOMStepsGHA, getSignStepsGHA)

import type { PipelineConfig } from '../lib/types';

// ── Pinned tool versions (mirrors TOOL_VERSIONS / TV in v1) ──────────────────

const TV = {
  actionCheckout:          'actions/checkout@v4',
  actionUploadArtifact:    'actions/upload-artifact@v4',
  actionDownloadArtifact:  'actions/download-artifact@v4',
  preCommitAction:         'pre-commit/action@v3.0.1',
  dependencyReview:        'actions/dependency-review-action@v4',
  codeqlUploadSarif:       'github/codeql-action/upload-sarif@v3',
  dockerLogin:             'docker/login-action@v3',
  dockerBuildPush:         'docker/build-push-action@v6',
  dockerSetupBuildx:       'docker/setup-buildx-action@v3',
  dockerMetadata:          'docker/metadata-action@v5',
  cosignInstaller:         'sigstore/cosign-installer@v3.7.0',
  trivyAction:             'aquasecurity/trivy-action@0.28.0',
  trivyImage:              'aquasec/trivy:0.57.1',
  sbomAction:              'anchore/sbom-action@v0.17.5',
  checkovAction:           'bridgecrewio/checkov-action@v12',
  gitleaksAction:          'gitleaks/gitleaks-action@v2',
  fossaAction:             'fossas/fossa-action@v2',
  zapBaseline:             'zaproxy/action-baseline@v0.13.0',
  slackAction:             'slackapi/slack-github-action@v1.27.0',
  codecovAction:           'codecov/codecov-action@v4',
  slsaGenerator:           'slsa-framework/slsa-github-generator/.github/workflows/generator_container_slsa3.yml@v2.0.0',
  awsConfigureCreds:       'aws-actions/configure-aws-credentials@v4',
  awsEcrLogin:             'aws-actions/amazon-ecr-login@v2',
  gcpAuth:                 'google-github-actions/auth@v2',
  azureLogin:              'azure/login@v2',
  semgrepVersion:          '1.92.0',
} as const;

// ── Registry metadata ─────────────────────────────────────────────────────────

interface RegMeta {
  registryUrl: string;
  imageRef:    string;
  extraPerms:  string;
  loginYAML:   string;
  promoteCmd:  string;
}

function buildRegMeta(regKey: string): RegMeta {
  switch (regKey) {
    case 'ecr':
      return {
        registryUrl: '${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION }}.amazonaws.com',
        imageRef:    '${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION }}.amazonaws.com/myapp:${{ github.sha }}',
        extraPerms:  '',
        loginYAML: `      - name: Configure AWS credentials (OIDC)
        uses: ${TV.awsConfigureCreds}
        with:
          role-to-assume: \${{ vars.AWS_OIDC_ROLE_ARN }}
          aws-region: \${{ vars.AWS_REGION }}
          mask-aws-account-id: true

      - name: Login to ECR
        uses: ${TV.awsEcrLogin}
        with:
          mask-password: true`,
        promoteCmd: `aws ecr batch-check-layer-availability \\
            --repository-name myapp \\
            --layer-digests \${{ needs.build.outputs.image-digest }}
          docker buildx imagetools create \\
            --tag \${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.\${{ vars.AWS_REGION }}.amazonaws.com/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
      };

    case 'gar':
      return {
        registryUrl: '${{ vars.GAR_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT }}/myrepo',
        imageRef:    '${{ vars.GAR_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT }}/myrepo/myapp:${{ github.sha }}',
        extraPerms:  '',
        loginYAML: `      - name: Authenticate to GCP (OIDC)
        id: auth
        uses: ${TV.gcpAuth}
        with:
          workload_identity_provider: \${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: \${{ vars.GCP_SERVICE_ACCOUNT }}
          token_format: access_token

      - name: Login to GAR
        uses: ${TV.dockerLogin}
        with:
          registry: \${{ vars.GAR_REGION }}-docker.pkg.dev
          username: oauth2accesstoken
          password: \${{ steps.auth.outputs.access_token }}`,
        promoteCmd: `gcloud artifacts docker tags add \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }} \\
            \${{ vars.GAR_REGION }}-docker.pkg.dev/\${{ vars.GCP_PROJECT }}/myrepo/myapp:latest`,
      };

    case 'acr':
      return {
        registryUrl: '${{ vars.ACR_NAME }}.azurecr.io',
        imageRef:    '${{ vars.ACR_NAME }}.azurecr.io/myapp:${{ github.sha }}',
        extraPerms:  '',
        loginYAML: `      - name: Azure login (OIDC federated credential)
        uses: ${TV.azureLogin}
        with:
          client-id: \${{ vars.AZURE_CLIENT_ID }}
          tenant-id: \${{ vars.AZURE_TENANT_ID }}
          subscription-id: \${{ vars.AZURE_SUBSCRIPTION_ID }}

      - name: Login to ACR
        run: az acr login --name \${{ vars.ACR_NAME }}`,
        promoteCmd: `az acr import \\
            --name \${{ vars.ACR_NAME }} \\
            --source \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }} \\
            --image myapp:latest`,
      };

    case 'dockerhub':
      return {
        registryUrl: 'docker.io/${{ vars.DOCKERHUB_USERNAME }}',
        imageRef:    '${{ vars.DOCKERHUB_USERNAME }}/myapp:${{ github.sha }}',
        extraPerms:  '',
        loginYAML: `      - name: Login to Docker Hub
        uses: ${TV.dockerLogin}
        with:
          username: \${{ vars.DOCKERHUB_USERNAME }}
          password: \${{ secrets.DOCKERHUB_TOKEN }}`,
        promoteCmd: `docker buildx imagetools create \\
            --tag \${{ vars.DOCKERHUB_USERNAME }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
      };

    case 'jfrog':
      return {
        registryUrl: '${{ vars.JFROG_REGISTRY }}',
        imageRef:    '${{ vars.JFROG_REGISTRY }}/myapp:${{ github.sha }}',
        extraPerms:  '',
        loginYAML: `      - name: Login to JFrog
        uses: ${TV.dockerLogin}
        with:
          registry: \${{ vars.JFROG_REGISTRY }}
          username: \${{ vars.JFROG_USERNAME }}
          password: \${{ secrets.JFROG_API_KEY }}`,
        promoteCmd: `# Re-tag by digest — JFrog supports digest-pinned promotion via buildx imagetools.
          docker buildx imagetools create \\
            --tag \${{ vars.JFROG_REGISTRY }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
      };

    case 'harbor':
      return {
        registryUrl: '${{ vars.HARBOR_HOST }}/${{ vars.HARBOR_PROJECT }}',
        imageRef:    '${{ vars.HARBOR_HOST }}/${{ vars.HARBOR_PROJECT }}/myapp:${{ github.sha }}',
        extraPerms:  '',
        loginYAML: `      - name: Login to Harbor
        uses: ${TV.dockerLogin}
        with:
          registry: \${{ vars.HARBOR_HOST }}
          username: \${{ vars.HARBOR_USERNAME }}
          password: \${{ secrets.HARBOR_PASSWORD }}`,
        promoteCmd: `docker buildx imagetools create \\
            --tag \${{ vars.HARBOR_HOST }}/\${{ vars.HARBOR_PROJECT }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
      };

    case 'nexus':
      return {
        registryUrl: '${{ vars.NEXUS_HOST }}:${{ vars.NEXUS_PORT }}',
        imageRef:    '${{ vars.NEXUS_HOST }}:${{ vars.NEXUS_PORT }}/myapp:${{ github.sha }}',
        extraPerms:  '',
        loginYAML: `      - name: Login to Nexus
        uses: ${TV.dockerLogin}
        with:
          registry: \${{ vars.NEXUS_HOST }}:\${{ vars.NEXUS_PORT }}
          username: \${{ vars.NEXUS_USERNAME }}
          password: \${{ secrets.NEXUS_PASSWORD }}`,
        promoteCmd: `docker buildx imagetools create \\
            --tag \${{ vars.NEXUS_HOST }}:\${{ vars.NEXUS_PORT }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
      };

    case 'quay':
      return {
        registryUrl: 'quay.io/${{ vars.QUAY_ORG }}',
        imageRef:    'quay.io/${{ vars.QUAY_ORG }}/myapp:${{ github.sha }}',
        extraPerms:  '',
        loginYAML: `      - name: Login to Quay.io
        uses: ${TV.dockerLogin}
        with:
          registry: quay.io
          username: \${{ vars.QUAY_ROBOT_ACCOUNT }}
          password: \${{ secrets.QUAY_ROBOT_TOKEN }}`,
        promoteCmd: `docker buildx imagetools create \\
            --tag quay.io/\${{ vars.QUAY_ORG }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
      };

    case 'ttlsh':
      return {
        registryUrl: 'ttl.sh',
        imageRef:    'ttl.sh/$(uuidgen):1h',
        extraPerms:  '',
        loginYAML: `      - name: ttl.sh requires no login
        run: echo "ttl.sh — anonymous push. Image auto-expires per tag suffix."`,
        promoteCmd: `# ttl.sh disposable images cannot be promoted — by design.
          # Re-push to a durable registry for any prod/test environment.
          echo "ttl.sh is intentionally ephemeral. Promote into GHCR/ECR before deploy."`,
      };

    // default: ghcr
    default:
      return {
        registryUrl: 'ghcr.io/${{ github.repository_owner }}',
        imageRef:    'ghcr.io/${{ github.repository_owner }}/myapp:${{ github.sha }}',
        extraPerms:  '  packages: write\n',
        loginYAML: `      - name: Login to GHCR
        uses: ${TV.dockerLogin}
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}`,
        promoteCmd: `docker buildx imagetools create \\
            --tag ghcr.io/\${{ github.repository_owner }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
      };
  }
}

// ── Helper: container scan steps ─────────────────────────────────────────────

function getScanStepsGHA(cfg: PipelineConfig, imageArg: string): string {
  const isPR = imageArg.startsWith('input');

  switch (cfg.scanner) {
    case 'grype':
      return `      - name: Load image
        ${isPR
          ? 'run: docker load -i /tmp/image.tar'
          : `run: |
          docker pull \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`}
      - name: Container scan — Grype
        run: |
          docker run --rm \\
            -v /var/run/docker.sock:/var/run/docker.sock \\
            anchore/grype:v0.85.0 \\
            ${isPR
              ? 'myapp:pr-${{ github.sha }}'
              : '${{ needs.build.outputs.image-ref }}@${{ needs.build.outputs.image-digest }}'} \\
            --severity critical --fail-on critical \\
            --output sarif > grype.sarif
      - uses: ${TV.codeqlUploadSarif}
        if: always()
        with:
          sarif_file: grype.sarif`;

    case 'snyk':
      return `      - name: Container scan — Snyk
        uses: snyk/actions/docker@master
        with:
          ${isPR
            ? 'image: myapp:pr-${{ github.sha }}'
            : 'image: ${{ needs.build.outputs.image-ref }}@${{ needs.build.outputs.image-digest }}'}
          args: --severity-threshold=high --file=Dockerfile
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
      - uses: ${TV.codeqlUploadSarif}
        if: always()
        with:
          sarif_file: snyk.sarif`;

    case 'anchore':
      return `      - name: Container scan — Anchore
        uses: anchore/scan-action@v4
        id: anchore-scan
        with:
          ${isPR
            ? 'image: myapp:pr-${{ github.sha }}'
            : 'image: ${{ needs.build.outputs.image-ref }}@${{ needs.build.outputs.image-digest }}'}
          fail-build: 'true'
          severity-cutoff: high
      - uses: ${TV.codeqlUploadSarif}
        if: always()
        with:
          sarif_file: \${{ steps.anchore-scan.outputs.sarif }}`;

    default: // trivy
      return isPR
        ? `      - name: Load image
        run: docker load -i /tmp/image.tar
      - name: Container scan — Trivy
        uses: ${TV.trivyAction}
        with:
          input: /tmp/image.tar
          format: sarif
          output: trivy.sarif
          severity: HIGH,CRITICAL
          exit-code: '1'
          ignore-unfixed: false
      - uses: ${TV.codeqlUploadSarif}
        if: always()
        with:
          sarif_file: trivy.sarif`
        : `      - name: Container scan — Trivy
        uses: ${TV.trivyAction}
        with:
          image-ref: \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          format: sarif
          output: trivy.sarif
          severity: HIGH,CRITICAL
          exit-code: '1'
          ignore-unfixed: false
      - uses: ${TV.codeqlUploadSarif}
        if: always()
        with:
          sarif_file: trivy.sarif`;
  }
}

// ── Helper: SBOM generation steps ────────────────────────────────────────────

function getSBOMStepsGHA(cfg: PipelineConfig, phase: 'pr' | 'main'): string {
  const isPR = phase === 'pr';
  const imageRef = isPR
    ? 'myapp:pr-${{ github.sha }}'
    : '${{ needs.build.outputs.image-ref }}@${{ needs.build.outputs.image-digest }}';

  switch (cfg.sbom) {
    case 'trivy':
      return `      ${isPR ? `- run: docker load -i /tmp/image.tar
      ` : ''}- name: SBOM generation — Trivy
        run: |
          docker run --rm \\
            -v /var/run/docker.sock:/var/run/docker.sock \\
            ${TV.trivyImage} \\
            image --format cyclonedx \\
            --output sbom.cdx.json \\
            ${imageRef}
      - uses: ${TV.actionUploadArtifact}
        with:
          name: sbom-${isPR ? 'pr-' : 'spdx-'}\${{ github.sha }}
          path: sbom.cdx.json`;

    case 'cyclonedx':
      return `      - name: SBOM generation — CycloneDX
        run: |
          npm install -g @cyclonedx/cyclonedx-npm
          cyclonedx-npm --output-format JSON --output-file sbom.cdx.json
      - uses: ${TV.actionUploadArtifact}
        with:
          name: sbom-${isPR ? 'pr-' : 'spdx-'}\${{ github.sha }}
          path: sbom.cdx.json`;

    case 'in-toto':
      return `      - name: SBOM + in-toto attestation — SLSA
        uses: ${TV.cosignInstaller}
      - run: |
          ${isPR ? '' : '# '}cosign attest --yes \\
            --predicate sbom.spdx.json \\
            --type spdxjson \\
            ${imageRef}
      - uses: ${TV.actionUploadArtifact}
        with:
          name: sbom-${isPR ? 'pr-' : 'spdx-'}\${{ github.sha }}
          path: sbom.spdx.json`;

    default: // syft
      return isPR
        ? `      - run: docker load -i /tmp/image.tar
      - uses: ${TV.sbomAction}
        with:
          image: ${imageRef}
          format: spdx-json
          output-file: sbom.spdx.json
      - uses: ${TV.actionUploadArtifact}
        with:
          name: sbom-\${{ github.sha }}
          path: sbom.spdx.json`
        : `      - uses: ${TV.cosignInstaller}
      - uses: ${TV.sbomAction}
        with:
          image: ${imageRef}
          format: spdx-json
          output-file: sbom.spdx.json
          dependency-snapshot: true
      - uses: ${TV.actionUploadArtifact}
        with:
          name: sbom-spdx-\${{ github.sha }}
          path: sbom.spdx.json`;
  }
}

// ── Helper: image signing steps ───────────────────────────────────────────────

function getSignStepsGHA(cfg: PipelineConfig): string {
  switch (cfg.signing) {
    case 'notary2':
      return `      - name: Install Notation
        run: |
          curl -Lo notation.tar.gz https://github.com/notaryproject/notation/releases/latest/download/notation_linux_amd64.tar.gz
          tar xf notation.tar.gz && mv notation /usr/local/bin/
      - name: Sign image — Notation (Notary v2)
        run: |
          notation sign \\
            --signature-format cose \\
            --key "\${{ secrets.NOTATION_KEY_NAME }}" \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`;

    case 'dct':
      return `      - name: Sign image — Docker Content Trust (legacy)
        env:
          DOCKER_CONTENT_TRUST: 1
          DOCKER_CONTENT_TRUST_SERVER: https://notary.docker.io
          DOCKER_CONTENT_TRUST_REPOSITORY_PASSPHRASE: \${{ secrets.DCT_PASSPHRASE }}
          DOCKER_CONTENT_TRUST_ROOT_PASSPHRASE: \${{ secrets.DCT_ROOT_PASSPHRASE }}
        run: |
          docker pull \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          docker tag \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }} \\
            \${{ needs.build.outputs.image-ref }}:signed
          docker push \${{ needs.build.outputs.image-ref }}:signed`;

    case 'in-toto':
      return `      - uses: ${TV.cosignInstaller}
      - name: Sign + attest image — in-toto / SLSA
        run: |
          cosign attest --yes \\
            --rekor-url https://rekor.sigstore.dev \\
            --predicate sbom.spdx.json \\
            --type spdxjson \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          cosign sign --yes \\
            --rekor-url https://rekor.sigstore.dev \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`;

    default: // cosign (keyless)
      return `      - uses: ${TV.cosignInstaller}
      - run: |
          cosign sign --yes --rekor-url https://rekor.sigstore.dev \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
      - run: |
          cosign attest --yes --rekor-url https://rekor.sigstore.dev \\
            --predicate sbom.spdx.json --type spdxjson \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`;
  }
}

// ── Stack + pkg-manager helpers for test/install commands ────────────────────

interface StackCmd {
  installCmd:          string;
  testCmd:             string;
  integrationTestCmd:  string;
  port:                string;
  healthPath:          string;
}

function resolveStackCmds(config: PipelineConfig): StackCmd {
  const beKey  = config.beKey ?? 'none';
  const feKey  = config.feKey ?? 'nextjs';
  const beGroup = (beKey.includes('-') ? beKey.split('-')[0] : beKey).toLowerCase();
  const pkgMgr  = config.pkgMgr ?? 'npm';

  // Integration test command — mirrors getIntegrationTestCmd() in v1.
  let integrationTestCmd = 'npm run test:integration';
  if (beGroup === 'python') integrationTestCmd = 'pytest tests/integration --no-cov';
  else if (beGroup === 'go')     integrationTestCmd = 'go test ./tests/integration/... -tags=integration -count=1';
  else if (beGroup === 'java')   integrationTestCmd = 'mvn verify -Pintegration-tests';
  else if (beGroup === 'dotnet') integrationTestCmd = 'dotnet test --filter Category=Integration';
  else if (beGroup === 'rust')   integrationTestCmd = 'cargo test --test "*integration*" --no-fail-fast';
  else if (beGroup === 'ruby')   integrationTestCmd = 'bundle exec rspec spec/integration';
  else if (beGroup === 'php')    integrationTestCmd = 'vendor/bin/phpunit --testsuite Integration';
  else if (beGroup === 'nodejs') integrationTestCmd = 'npm run test:integration';

  // install / test from pkg manager defaults.
  const PM_INSTALL: Record<string, string> = {
    npm: 'npm ci --ignore-scripts', pnpm: 'pnpm install --frozen-lockfile',
    yarn: 'yarn install --frozen-lockfile', bun: 'bun install --frozen-lockfile',
    pip: 'pip install --no-cache-dir -r requirements.txt',
    poetry: 'poetry install --no-dev --no-interaction',
    uv: 'uv sync --frozen --no-dev',
    maven: 'mvn dependency:resolve -q',
    gradle: './gradlew dependencies --no-daemon',
    go: 'go mod download', cargo: 'cargo fetch',
    bundler: 'bundle install --without development',
    composer: 'composer install --no-dev --optimize-autoloader',
    dotnet: 'dotnet restore',
  };

  const BE_TEST: Record<string, string> = {
    go: 'go test ./... -race -coverprofile=coverage.out',
    python: 'pytest --cov --cov-report=xml',
    java: 'mvn test',
    dotnet: 'dotnet test',
    rust: 'cargo test',
    ruby: 'bundle exec rspec',
    php: 'vendor/bin/phpunit',
    nodejs: 'npm test',
  };

  const FE_TEST: Record<string, string> = {
    nextjs: 'npm test -- --coverage --ci',
    react: 'npm test -- --coverage --ci',
    vue: 'npm run test:unit',
    angular: 'ng test --watch=false --browsers=ChromeHeadless',
  };

  const testCmd = BE_TEST[beGroup] ?? FE_TEST[feKey] ?? 'npm test';
  const installCmd = PM_INSTALL[pkgMgr] ?? 'npm ci --ignore-scripts';

  const port       = config.port       ?? '3000';
  const healthPath = config.healthPath ?? '/api/health';

  return { installCmd, testCmd, integrationTestCmd, port, healthPath };
}

// ── PR workflow ───────────────────────────────────────────────────────────────

export function generatePRWorkflow(config: PipelineConfig): string {
  // PR pipeline never pushes — registry metadata not needed here.
  return `name: PR Checks
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  security-events: write
  pull-requests: read

jobs:
  hooks:
    name: "S1: Pre-commit Hooks"
    runs-on: ubuntu-24.04
    steps:
      - uses: ${TV.actionCheckout}
        with:
          fetch-depth: 0
      - uses: ${TV.preCommitAction}
        with:
          extra_args: --all-files

  security:
    name: "Security Scans"
    runs-on: ubuntu-24.04
    strategy:
      fail-fast: false
      matrix:
        scan: [dependency-audit, sast, license, iac-scan, secret-scan]
    steps:
      - uses: ${TV.actionCheckout}
        with:
          fetch-depth: 0
      - name: Dependency review
        if: matrix.scan == 'dependency-audit'
        uses: ${TV.dependencyReview}
        with:
          fail-on-severity: high
          deny-licenses: GPL-2.0, GPL-3.0, LGPL-2.1, AGPL-3.0
      - name: SAST — Semgrep
        if: matrix.scan == 'sast'
        run: |
          pip install semgrep==${TV.semgrepVersion}
          semgrep ci --config p/owasp-top-ten --config p/secrets --sarif --output semgrep.sarif --error
        env:
          SEMGREP_APP_TOKEN: \${{ secrets.SEMGREP_APP_TOKEN }}
      - name: Upload Semgrep SARIF
        if: matrix.scan == 'sast' && always()
        uses: ${TV.codeqlUploadSarif}
        with:
          sarif_file: semgrep.sarif
      - name: License compliance — FOSSA
        if: matrix.scan == 'license'
        uses: ${TV.fossaAction}
        with:
          api-key: \${{ secrets.FOSSA_API_KEY }}
          run-tests: true
      - name: IaC scan — Checkov
        if: matrix.scan == 'iac-scan'
        uses: ${TV.checkovAction}
        with:
          directory: .
          framework: dockerfile,kubernetes,github_actions
          output_format: sarif
          output_file_path: checkov.sarif
          soft_fail: false
      - name: Upload Checkov SARIF
        if: matrix.scan == 'iac-scan' && always()
        uses: ${TV.codeqlUploadSarif}
        with:
          sarif_file: checkov.sarif
      - name: Secret scan — Gitleaks
        if: matrix.scan == 'secret-scan'
        uses: ${TV.gitleaksAction}
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          GITLEAKS_CONFIG: .gitleaks.toml

  build:
    name: "S6: Docker Build (no push)"
    runs-on: ubuntu-24.04
    needs: [hooks, security]
    steps:
      - uses: ${TV.actionCheckout}
      - uses: ${TV.dockerSetupBuildx}
      - name: Build image (no push)
        uses: ${TV.dockerBuildPush}
        with:
          context: .
          platforms: linux/amd64
          push: false
          tags: myapp:pr-\${{ github.sha }}
          outputs: type=docker,dest=/tmp/image.tar
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: false
          sbom: false
      - uses: ${TV.actionUploadArtifact}
        with:
          name: image-tar-\${{ github.sha }}
          path: /tmp/image.tar
          retention-days: 1

  sbom-gen:
    name: "S8a: SBOM Generation (${config.sbom})"
    runs-on: ubuntu-24.04
    needs: [build]
    steps:
      - uses: ${TV.actionDownloadArtifact}
        with:
          name: image-tar-\${{ github.sha }}
          path: /tmp
${getSBOMStepsGHA(config, 'pr')}

  scan:
    name: "S7: Container Vulnerability Scan (${config.scanner})"
    runs-on: ubuntu-24.04
    needs: [sbom-gen]
    steps:
      - uses: ${TV.actionDownloadArtifact}
        with:
          name: image-tar-\${{ github.sha }}
          path: /tmp
${getScanStepsGHA(config, 'input: /tmp/image.tar')}`;
}

// ── Main workflow ─────────────────────────────────────────────────────────────

export function generateMainWorkflow(config: PipelineConfig): string {
  const reg = buildRegMeta(config.regKey);
  const cmds = resolveStackCmds(config);
  const ciIssuer = 'https://token.actions.githubusercontent.com';

  return `name: Main Pipeline
on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write
  security-events: write
  actions: read
${reg.extraPerms}
env:
  IMAGE_NAME: myapp
  REGISTRY: ${reg.registryUrl}
  IMAGE_REF: ${reg.imageRef}

jobs:
  setup:
    name: "S0: Auth + Registry Login"
    runs-on: ubuntu-24.04
    steps:
      - uses: ${TV.actionCheckout}
        with:
          fetch-depth: 0
${reg.loginYAML}

  hooks:
    name: "S1: Pre-commit Hooks"
    runs-on: ubuntu-24.04
    needs: [setup]
    steps:
      - uses: ${TV.actionCheckout}
        with:
          fetch-depth: 0
      - uses: ${TV.preCommitAction}
        with:
          extra_args: --all-files

  security:
    name: "Security Scans"
    runs-on: ubuntu-24.04
    needs: [setup]
    strategy:
      fail-fast: false
      matrix:
        scan: [dependency-audit, sast, license, iac-scan, secret-scan]
    steps:
      - uses: ${TV.actionCheckout}
        with:
          fetch-depth: 0
      - name: Dependency review
        if: matrix.scan == 'dependency-audit'
        uses: ${TV.dependencyReview}
        with:
          fail-on-severity: high
      - name: SAST
        if: matrix.scan == 'sast'
        run: pip install semgrep==${TV.semgrepVersion} && semgrep ci --config p/owasp-top-ten --sarif --output semgrep.sarif --error
        env:
          SEMGREP_APP_TOKEN: \${{ secrets.SEMGREP_APP_TOKEN }}
      - name: License
        if: matrix.scan == 'license'
        uses: ${TV.fossaAction}
        with:
          api-key: \${{ secrets.FOSSA_API_KEY }}
          run-tests: true
      - name: IaC
        if: matrix.scan == 'iac-scan'
        uses: ${TV.checkovAction}
        with:
          directory: .
          framework: dockerfile,kubernetes,github_actions
      - name: Secrets
        if: matrix.scan == 'secret-scan'
        uses: ${TV.gitleaksAction}
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

  build:
    name: "S6: Build + Push"
    runs-on: ubuntu-24.04
    needs: [hooks, security]
    outputs:
      image-ref: \${{ steps.image-name.outputs.ref }}
      image-base: \${{ steps.image-name.outputs.base }}
      image-digest: \${{ steps.build.outputs.digest }}
    steps:
      - uses: ${TV.actionCheckout}
${reg.loginYAML}
      - uses: ${TV.dockerSetupBuildx}
      - id: meta
        uses: ${TV.dockerMetadata}
        with:
          images: ${reg.registryUrl}/\${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=,format=long
            type=ref,event=branch
      - id: build
        uses: ${TV.dockerBuildPush}
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          provenance: false
          sbom: false
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - id: image-name
        run: |
          echo "ref=${reg.registryUrl}/\${{ env.IMAGE_NAME }}:\${{ github.sha }}" >> \$GITHUB_OUTPUT
          echo "base=${reg.registryUrl}/\${{ env.IMAGE_NAME }}" >> \$GITHUB_OUTPUT

  sbom-gen:
    name: "S8a: SBOM Generation (${config.sbom})"
    runs-on: ubuntu-24.04
    needs: [build]
    steps:
${getSBOMStepsGHA(config, 'main')}

  scan:
    name: "S7: Container Vulnerability Scan (${config.scanner})"
    runs-on: ubuntu-24.04
    needs: [sbom-gen, build]
    steps:
${getScanStepsGHA(config, 'image-ref: ${{ needs.build.outputs.image-ref }}@${{ needs.build.outputs.image-digest }}')}

  sign:
    name: "S8b: Sign + Attest (${config.signing})"
    runs-on: ubuntu-24.04
    # Hard-depends on sbom-gen — the SBOM artifact is downloaded in this job.
    needs: [scan, build, sbom-gen]
    permissions:
      id-token: write
      packages: write
    steps:
      - uses: ${TV.actionDownloadArtifact}
        with:
          name: sbom-spdx-\${{ github.sha }}
${reg.loginYAML}
${getSignStepsGHA(config)}

  test:
    name: "S9: Test Suite"
    runs-on: ubuntu-24.04
    needs: [build]
    steps:
      - uses: ${TV.actionCheckout}
      - run: ${cmds.installCmd}
      - run: ${cmds.testCmd}
        env:
          CI: "true"
      - uses: ${TV.codecovAction}
        if: always()
        with:
          fail_ci_if_error: false

  integration-test:
    name: "S9a: Integration Tests"
    runs-on: ubuntu-24.04
    needs: [test, build]
    steps:
      - uses: ${TV.actionCheckout}
${reg.loginYAML}
      - run: |
          docker pull \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          docker run -d --name app -p ${cmds.port}:${cmds.port} \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          timeout 30 bash -c 'until curl -sf http://localhost:${cmds.port}${cmds.healthPath}; do sleep 1; done'
          ${cmds.installCmd}
          ${cmds.integrationTestCmd}
        env:
          TEST_BASE_URL: http://localhost:${cmds.port}
      - run: docker rm -f app || true
        if: always()

  dast:
    name: "DAST: Dynamic App Security"
    runs-on: ubuntu-24.04
    needs: [integration-test, build]
    steps:
${reg.loginYAML}
      - run: |
          docker pull \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          docker run -d -p ${cmds.port}:${cmds.port} --name dastapp \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
          timeout 30 bash -c 'until curl -sf http://localhost:${cmds.port}${cmds.healthPath}; do sleep 1; done'
      - uses: zaproxy/action-baseline@v0.13.0
        with:
          target: 'http://localhost:${cmds.port}'
          fail_action: true
      - run: docker rm -f dastapp || true
        if: always()

  provenance:
    name: "S10: SLSA Level 3 Provenance"
    needs: [scan, build]
    permissions:
      actions: read
      id-token: write
      packages: write
    # image: bare repository (no tag). digest: immutable identity.
    # Registry creds: GHCR uses GITHUB_TOKEN; other registries — replace with
    # the appropriate secret in repo settings (see Setup Guide for each registry).
    uses: ${TV.slsaGenerator}
    with:
      image: \${{ needs.build.outputs.image-base }}
      digest: \${{ needs.build.outputs.image-digest }}
    secrets:
      registry-username: \${{ secrets.SLSA_REGISTRY_USERNAME || github.actor }}
      registry-password: \${{ secrets.SLSA_REGISTRY_PASSWORD || secrets.GITHUB_TOKEN }}

  notify:
    name: "S12: Build Notification"
    runs-on: ubuntu-24.04
    needs: [sign, test, dast, provenance]
    if: always()
    steps:
      - name: Notify success
        if: \${{ !contains(needs.*.result, 'failure') }}
        uses: ${TV.slackAction}
        with:
          channel-id: 'C0DEPLOYMENTS'
          payload: |
            {"text": "✅ Pipeline passed: \${{ github.repository }} @ \${{ github.sha }}"}
        env:
          SLACK_BOT_TOKEN: \${{ secrets.SLACK_BOT_TOKEN }}
      - name: Notify failure
        if: \${{ contains(needs.*.result, 'failure') }}
        uses: ${TV.slackAction}
        with:
          channel-id: 'C0ALERTS'
          payload: |
            {"text": "❌ Pipeline FAILED: \${{ github.repository }} @ \${{ github.sha }}"}
        env:
          SLACK_BOT_TOKEN: \${{ secrets.SLACK_BOT_TOKEN }}

  promote:
    name: "S13: Promote to :latest"
    runs-on: ubuntu-24.04
    # Gated on ACTUAL upstream jobs — notify always succeeds (if: always()),
    # so checking notify.result would let a failed pipeline promote :latest.
    # I-13: :latest must never reflect a failed build.
    needs: [build, sign, test, dast, provenance]
    if: \${{ needs.sign.result == 'success' && needs.test.result == 'success' && needs.dast.result == 'success' && needs.provenance.result == 'success' }}
    steps:
${reg.loginYAML}
      - run: |
          ${reg.promoteCmd}

  verify:
    name: "S14: Signature Verification"
    runs-on: ubuntu-24.04
    needs: [promote, build]
    steps:
      - uses: ${TV.cosignInstaller}
      - run: |
          cosign verify \\
            --certificate-identity-regexp \\
              "https://github.com/\${{ github.repository }}/.github/workflows/" \\
            --certificate-oidc-issuer "${ciIssuer}" \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}
      - run: |
          cosign verify-attestation --type spdxjson \\
            --certificate-identity-regexp \\
              "https://github.com/\${{ github.repository }}/.github/workflows/" \\
            --certificate-oidc-issuer "${ciIssuer}" \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }} \\
            | jq '.payload | @base64d | fromjson | .subject[0].name'`;
}
