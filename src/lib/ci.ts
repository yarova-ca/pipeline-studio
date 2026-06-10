// CI system definitions — every supported CI platform with trigger names and OIDC metadata.
// Fields drive: workflow file generation, OIDC config blocks, cosign signing decisions.
// Verified current as of 2026-05-24.

export interface CiDef {
  label: string;
  // File paths for generated workflow configs
  prFile: string;
  mainFile: string;
  // Trigger event names (human-readable, used in comments and docs)
  triggerPR: string;
  triggerMain: string;
  // OIDC issuer URL — null when the CI system does not support OIDC
  oidcIssuer: string | null;
  // Whether this CI system supports cosign image signing
  cosignSupported: boolean;
}

export const CI_SYSTEMS: Record<string, CiDef> = {
  'github-actions': {
    label: 'GitHub Actions',
    prFile: 'pr-checks.yml',
    mainFile: 'main-pipeline.yml',
    triggerPR: 'pull_request',
    triggerMain: 'push to main',
    oidcIssuer: 'https://token.actions.githubusercontent.com',
    cosignSupported: true,
  },
  'gitlab-ci': {
    label: 'GitLab CI',
    prFile: '.gitlab-ci.yml',
    mainFile: '.gitlab-ci.yml',
    triggerPR: 'merge_request_event',
    triggerMain: 'push to default branch',
    oidcIssuer: 'https://gitlab.com',
    cosignSupported: true,
  },
  jenkins: {
    label: 'Jenkins',
    prFile: 'Jenkinsfile',
    mainFile: 'Jenkinsfile',
    triggerPR: 'PR scan',
    triggerMain: 'branch push',
    oidcIssuer: null,
    cosignSupported: false,
  },
  azdo: {
    label: 'Azure DevOps',
    prFile: 'azure-pipelines.yml',
    mainFile: 'azure-pipelines.yml',
    triggerPR: 'PR trigger',
    triggerMain: 'branch trigger',
    oidcIssuer: 'https://vstoken.dev.azure.com/{org}',
    cosignSupported: true,
  },
  circleci: {
    label: 'CircleCI',
    prFile: '.circleci/config.yml',
    mainFile: '.circleci/config.yml',
    triggerPR: 'PR workflow',
    triggerMain: 'main workflow',
    oidcIssuer: 'https://oidc.circleci.com/org/{org-id}',
    cosignSupported: true,
  },
  tekton: {
    label: 'Tekton',
    prFile: 'tekton/pipeline-pr.yaml',
    mainFile: 'tekton/pipeline-main.yaml',
    triggerPR: 'EventListener',
    triggerMain: 'EventListener',
    oidcIssuer: 'https://kubernetes.default.svc.cluster.local',
    cosignSupported: true,
  },
  // Drone CI + Bitbucket Pipelines intentionally omitted.
  // Full per-stage YAML generators don't exist yet.
  // Re-add when complete handlers ship.
};
