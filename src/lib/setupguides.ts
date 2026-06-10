// Registry setup guides — step-by-step onboarding for all 9 supported registries.
// Verified current as of 2026-05-24.

export interface SetupStep {
  title: string;
  body: string;
}

export interface SetupGuide {
  name: string;
  oidc: boolean;
  steps: SetupStep[];
}

export const SETUP_GUIDES: Record<string, SetupGuide> = {
  ghcr: {
    name: 'GHCR',
    oidc: true,
    steps: [
      {
        title: 'No OIDC setup required',
        body: 'GHCR uses GITHUB_TOKEN — automatically available in all GitHub Actions workflows. No external credential ever stored.',
      },
      {
        title: 'Configure branch protection',
        body: 'Settings → Branches → Add rule for main:\n✅ Require PR\n✅ Require status checks (select your CI jobs)\n✅ No force push',
      },
      {
        title: 'Enable secret scanning',
        body: 'Settings → Code security → Secret scanning + Push protection → Enable both.',
      },
    ],
  },

  ecr: {
    name: 'ECR',
    oidc: true,
    steps: [
      {
        title: 'Create ECR repository',
        body: 'aws ecr create-repository \\\n  --repository-name myapp \\\n  --image-scanning-configuration scanOnPush=true \\\n  --region us-east-1',
      },
      {
        title: 'Create OIDC provider',
        body: 'aws iam create-open-id-connect-provider \\\n  --url https://token.actions.githubusercontent.com \\\n  --client-id-list sts.amazonaws.com',
      },
      {
        title: 'Create IAM role',
        body: 'Create github-actions-ecr-role with trust policy for token.actions.githubusercontent.com.\nAttach AmazonEC2ContainerRegistryFullAccess.\nScope the trust to your org/repo in the Condition block.',
      },
      {
        title: 'Add GitHub Actions variables (not secrets — OIDC uses no stored keys)',
        body: 'Settings → Secrets and variables → Actions → Variables tab:\nAWS_ACCOUNT_ID\nAWS_REGION\nAWS_OIDC_ROLE_ARN\n\nSecrets: none.',
      },
    ],
  },

  gar: {
    name: 'GAR',
    oidc: true,
    steps: [
      {
        title: 'Create repository',
        body: 'gcloud artifacts repositories create myapp \\\n  --repository-format=docker \\\n  --location=us-central1',
      },
      {
        title: 'Create Workload Identity Pool',
        body: 'gcloud iam workload-identity-pools create github-pool \\\n  --location=global\n\ngcloud iam workload-identity-pools providers create-oidc github-provider \\\n  --location=global \\\n  --workload-identity-pool=github-pool \\\n  --issuer-uri=https://token.actions.githubusercontent.com \\\n  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"',
      },
      {
        title: 'Add GitHub Actions variables (not secrets — OIDC uses no stored keys)',
        body: 'Settings → Secrets and variables → Actions → Variables tab:\nGCP_PROJECT\nGAR_REGION\nGCP_WORKLOAD_IDENTITY_PROVIDER\nGCP_SERVICE_ACCOUNT\n\nSecrets: none.',
      },
    ],
  },

  acr: {
    name: 'ACR',
    oidc: true,
    steps: [
      {
        title: 'Create ACR',
        body: 'az acr create \\\n  --name myappregistry \\\n  --resource-group myRG \\\n  --sku Basic',
      },
      {
        title: 'Create service principal + federated credential',
        body: '# Create SP and assign AcrPush role\naz ad sp create-for-rbac --name github-actions-acr\naz role assignment create \\\n  --assignee <sp-client-id> \\\n  --role AcrPush \\\n  --scope /subscriptions/<sub-id>/resourceGroups/myRG/providers/Microsoft.ContainerRegistry/registries/myappregistry\n\n# Add federated credential for GitHub Actions\naz ad app federated-credential create \\\n  --id <app-id> \\\n  --parameters cred.json',
      },
      {
        title: 'Add GitHub Actions variables (not secrets — OIDC uses no stored keys)',
        body: 'Settings → Secrets and variables → Actions → Variables tab:\nACR_NAME\nAZURE_CLIENT_ID\nAZURE_TENANT_ID\nAZURE_SUBSCRIPTION_ID\n\nSecrets: none.',
      },
    ],
  },

  dockerhub: {
    name: 'Docker Hub',
    oidc: false,
    steps: [
      {
        title: 'Create access token',
        body: 'hub.docker.com → Account Settings → Security → New Access Token → Read & Write.\nRotate every 90 days — set a calendar reminder.',
      },
      {
        title: 'Add GitHub Actions variables AND secrets',
        body: 'Variables (public):\nDOCKERHUB_USERNAME\nDOCKERHUB_ORG\n\nSecrets (encrypted — rotate every 90 days):\nDOCKERHUB_TOKEN',
      },
      {
        title: 'Security note: no OIDC support',
        body: 'Docker Hub requires stored credentials. This means a long-lived secret exists in GitHub.\nConsider GHCR or ECR for better security posture. If staying on Docker Hub: rotate the token quarterly and enable rate-limit awareness in your pipeline.',
      },
    ],
  },

  jfrog: {
    name: 'JFrog Artifactory',
    oidc: false,
    steps: [
      {
        title: 'Configure JFrog repository',
        body: 'Create a Docker repository in JFrog Artifactory.\nGenerate an API key for a dedicated service account (not personal).\nAssign push/pull permissions to the service account on this repository only.',
      },
      {
        title: 'Add variables and secret',
        body: 'Variables:\nJFROG_REGISTRY (e.g. myorg.jfrog.io)\nJFROG_USERNAME\n\nSecrets:\nJFROG_API_KEY',
      },
    ],
  },

  harbor: {
    name: 'Harbor',
    oidc: false,
    steps: [
      {
        title: 'Configure Harbor project',
        body: 'Create a project in Harbor.\nCreate a robot account: Administration → Robot Accounts → New Robot Account.\nAssign: push + pull + delete on the target project.',
      },
      {
        title: 'Add variables and secret',
        body: 'Variables:\nHARBOR_HOST (e.g. registry.mycompany.com)\nHARBOR_PROJECT\nHARBOR_USERNAME (robot account name)\n\nSecrets:\nHARBOR_PASSWORD (robot account token)',
      },
    ],
  },

  nexus: {
    name: 'Nexus Repository',
    oidc: false,
    steps: [
      {
        title: 'Configure Nexus repository',
        body: 'Create a Docker hosted repository in Nexus (Repository Manager → Repositories → Create → docker (hosted)).\nCreate a service account with nx-repository-view-docker-*-edit privilege.',
      },
      {
        title: 'Add variables and secret',
        body: 'Variables:\nNEXUS_HOST (e.g. nexus.mycompany.com)\nNEXUS_PORT (e.g. 5000)\nNEXUS_USERNAME\n\nSecrets:\nNEXUS_PASSWORD',
      },
    ],
  },

  quay: {
    name: 'Quay.io',
    oidc: false,
    steps: [
      {
        title: 'Create robot account',
        body: 'quay.io → Organization → Robot Accounts → Create Robot Account.\nAssign: Write permission on the target repository.',
      },
      {
        title: 'Add variables and secret',
        body: 'Variables:\nQUAY_ORG\nQUAY_ROBOT_ACCOUNT (format: orgname+robotname)\n\nSecrets:\nQUAY_ROBOT_TOKEN',
      },
    ],
  },
};
