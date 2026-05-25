// Registry definitions — supported container registries with auth YAML snippets.
// Fields drive: CI login step generation, image ref templates, promote commands.
// Template variables (e.g. ${{ github.sha }}) are preserved as literal strings
// for injection into generated YAML output.
// Verified current as of 2026-05-24.

export interface RegistryDef {
  name: string;
  label: string;
  // Image registry hostname / path prefix
  registryUrl: string;
  // GitLab CI equivalent registry expression
  gitlabRegistry: string;
  // Full image reference template including the commit SHA tag
  imageRef: string;
  // Human-readable OIDC setup note shown in the studio UI
  oidcNote: string;
  // Extra GitHub Actions `permissions:` block lines (empty string if none)
  extraPerms: string;
  // Ready-to-paste YAML for the CI login step
  loginYAML: string;
  // Command(s) to promote a digest-pinned image to a stable tag
  promoteCmd: string;
  // OIDC issuer used when verifying image signatures
  verifyIssuer: string;
}

export const REGS: Record<string, RegistryDef> = {
  ghcr: {
    name: 'GHCR',
    label: 'GitHub Container Registry',
    registryUrl: 'ghcr.io/${{ github.repository_owner }}',
    gitlabRegistry: '$CI_REGISTRY',
    imageRef: 'ghcr.io/${{ github.repository_owner }}/myapp:${{ github.sha }}',
    oidcNote: 'Uses GITHUB_TOKEN — no OIDC setup required.',
    extraPerms: '  packages: write\n',
    loginYAML: `      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}`,
    promoteCmd: `docker buildx imagetools create \\
            --tag ghcr.io/\${{ github.repository_owner }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
    verifyIssuer: 'https://token.actions.githubusercontent.com',
  },

  ecr: {
    name: 'ECR',
    label: 'AWS Elastic Container Registry',
    registryUrl: '${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION }}.amazonaws.com',
    gitlabRegistry: '$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com',
    imageRef: '${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.${{ vars.AWS_REGION }}.amazonaws.com/myapp:${{ github.sha }}',
    oidcNote: 'Requires IAM role with trust policy for token.actions.githubusercontent.com.',
    extraPerms: '',
    loginYAML: `      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: \${{ vars.AWS_OIDC_ROLE_ARN }}
          aws-region: \${{ vars.AWS_REGION }}
          mask-aws-account-id: true

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2
        with:
          mask-password: true`,
    promoteCmd: `aws ecr batch-check-layer-availability \\
            --repository-name myapp \\
            --layer-digests \${{ needs.build.outputs.image-digest }}
          docker buildx imagetools create \\
            --tag \${{ vars.AWS_ACCOUNT_ID }}.dkr.ecr.\${{ vars.AWS_REGION }}.amazonaws.com/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
    verifyIssuer: 'https://token.actions.githubusercontent.com',
  },

  gar: {
    name: 'GAR',
    label: 'Google Artifact Registry',
    registryUrl: '${{ vars.GAR_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT }}/myrepo',
    gitlabRegistry: '$GAR_REGION-docker.pkg.dev/$GCP_PROJECT/myrepo',
    imageRef: '${{ vars.GAR_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT }}/myrepo/myapp:${{ github.sha }}',
    oidcNote: 'Requires Workload Identity Pool + Provider for GitHub Actions.',
    extraPerms: '',
    loginYAML: `      - name: Authenticate to GCP (OIDC)
        id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: \${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: \${{ vars.GCP_SERVICE_ACCOUNT }}
          token_format: access_token

      - name: Login to GAR
        uses: docker/login-action@v3
        with:
          registry: \${{ vars.GAR_REGION }}-docker.pkg.dev
          username: oauth2accesstoken
          password: \${{ steps.auth.outputs.access_token }}`,
    promoteCmd: `gcloud artifacts docker tags add \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }} \\
            \${{ vars.GAR_REGION }}-docker.pkg.dev/\${{ vars.GCP_PROJECT }}/myrepo/myapp:latest`,
    verifyIssuer: 'https://token.actions.githubusercontent.com',
  },

  acr: {
    name: 'ACR',
    label: 'Azure Container Registry',
    registryUrl: '${{ vars.ACR_NAME }}.azurecr.io',
    gitlabRegistry: '$ACR_NAME.azurecr.io',
    imageRef: '${{ vars.ACR_NAME }}.azurecr.io/myapp:${{ github.sha }}',
    oidcNote: 'Requires federated credential on Azure service principal.',
    extraPerms: '',
    loginYAML: `      - name: Azure login (OIDC federated credential)
        uses: azure/login@v2
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
    verifyIssuer: 'https://token.actions.githubusercontent.com',
  },

  dockerhub: {
    name: 'Docker Hub',
    label: 'Docker Hub',
    registryUrl: 'docker.io/${{ vars.DOCKERHUB_USERNAME }}',
    gitlabRegistry: 'docker.io/$DOCKERHUB_USERNAME',
    imageRef: '${{ vars.DOCKERHUB_USERNAME }}/myapp:${{ github.sha }}',
    oidcNote: 'Docker Hub requires username + token (no OIDC). Store as GitHub secret.',
    extraPerms: '',
    loginYAML: `      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: \${{ vars.DOCKERHUB_USERNAME }}
          password: \${{ secrets.DOCKERHUB_TOKEN }}`,
    promoteCmd: `docker buildx imagetools create \\
            --tag \${{ vars.DOCKERHUB_USERNAME }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
    verifyIssuer: 'https://token.actions.githubusercontent.com',
  },

  jfrog: {
    name: 'JFrog',
    label: 'JFrog Artifactory',
    registryUrl: '${{ vars.JFROG_REGISTRY }}',
    gitlabRegistry: '$JFROG_REGISTRY',
    imageRef: '${{ vars.JFROG_REGISTRY }}/myapp:${{ github.sha }}',
    oidcNote: 'JFrog supports OIDC via Platform OIDC configuration. Fallback: API key as secret.',
    extraPerms: '',
    loginYAML: `      - name: Login to JFrog
        uses: docker/login-action@v3
        with:
          registry: \${{ vars.JFROG_REGISTRY }}
          username: \${{ vars.JFROG_USERNAME }}
          password: \${{ secrets.JFROG_API_KEY }}`,
    promoteCmd: `# Re-tag by digest — JFrog supports digest-pinned promotion via buildx imagetools.
          docker buildx imagetools create \\
            --tag \${{ vars.JFROG_REGISTRY }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
    verifyIssuer: 'https://token.actions.githubusercontent.com',
  },

  harbor: {
    name: 'Harbor',
    label: 'Harbor (self-hosted)',
    registryUrl: '${{ vars.HARBOR_HOST }}/${{ vars.HARBOR_PROJECT }}',
    gitlabRegistry: '$HARBOR_HOST/$HARBOR_PROJECT',
    imageRef: '${{ vars.HARBOR_HOST }}/${{ vars.HARBOR_PROJECT }}/myapp:${{ github.sha }}',
    oidcNote: 'Harbor supports OIDC via robot accounts. Store robot account credentials as secrets.',
    extraPerms: '',
    loginYAML: `      - name: Login to Harbor
        uses: docker/login-action@v3
        with:
          registry: \${{ vars.HARBOR_HOST }}
          username: \${{ vars.HARBOR_USERNAME }}
          password: \${{ secrets.HARBOR_PASSWORD }}`,
    promoteCmd: `docker buildx imagetools create \\
            --tag \${{ vars.HARBOR_HOST }}/\${{ vars.HARBOR_PROJECT }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
    verifyIssuer: 'https://token.actions.githubusercontent.com',
  },

  nexus: {
    name: 'Nexus',
    label: 'Nexus Repository',
    registryUrl: '${{ vars.NEXUS_HOST }}:${{ vars.NEXUS_PORT }}',
    gitlabRegistry: '$NEXUS_HOST:$NEXUS_PORT',
    imageRef: '${{ vars.NEXUS_HOST }}:${{ vars.NEXUS_PORT }}/myapp:${{ github.sha }}',
    oidcNote: 'Nexus Repository does not support OIDC. Use service account credentials as secrets.',
    extraPerms: '',
    loginYAML: `      - name: Login to Nexus
        uses: docker/login-action@v3
        with:
          registry: \${{ vars.NEXUS_HOST }}:\${{ vars.NEXUS_PORT }}
          username: \${{ vars.NEXUS_USERNAME }}
          password: \${{ secrets.NEXUS_PASSWORD }}`,
    promoteCmd: `docker buildx imagetools create \\
            --tag \${{ vars.NEXUS_HOST }}:\${{ vars.NEXUS_PORT }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
    verifyIssuer: 'https://token.actions.githubusercontent.com',
  },

  quay: {
    name: 'Quay.io',
    label: 'Quay.io',
    registryUrl: 'quay.io/${{ vars.QUAY_ORG }}',
    gitlabRegistry: 'quay.io/$QUAY_ORG',
    imageRef: 'quay.io/${{ vars.QUAY_ORG }}/myapp:${{ github.sha }}',
    oidcNote: 'Quay.io uses robot accounts. No OIDC. Store robot token as GitHub secret.',
    extraPerms: '',
    loginYAML: `      - name: Login to Quay.io
        uses: docker/login-action@v3
        with:
          registry: quay.io
          username: \${{ vars.QUAY_ROBOT_ACCOUNT }}
          password: \${{ secrets.QUAY_ROBOT_TOKEN }}`,
    promoteCmd: `docker buildx imagetools create \\
            --tag quay.io/\${{ vars.QUAY_ORG }}/myapp:latest \\
            \${{ needs.build.outputs.image-ref }}@\${{ needs.build.outputs.image-digest }}`,
    verifyIssuer: 'https://token.actions.githubusercontent.com',
  },

  ttlsh: {
    name: 'ttl.sh',
    label: 'ttl.sh (ephemeral · 1h-24h)',
    registryUrl: 'ttl.sh',
    gitlabRegistry: 'ttl.sh',
    imageRef: 'ttl.sh/$(uuidgen):1h',
    oidcNote: 'No auth. Images auto-delete after TTL. Use for short-lived demos + CI smoke only.',
    extraPerms: '',
    loginYAML: `      - name: ttl.sh requires no login
        run: echo "ttl.sh — anonymous push. Image auto-expires per tag suffix."`,
    promoteCmd: `# ttl.sh disposable images cannot be promoted — by design.
          # Re-push to a durable registry for any prod/test environment.
          echo "ttl.sh is intentionally ephemeral. Promote into GHCR/ECR before deploy."`,
    verifyIssuer: 'https://token.actions.githubusercontent.com',
  },
};
