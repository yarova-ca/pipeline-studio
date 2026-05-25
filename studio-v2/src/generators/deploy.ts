// Deploy manifest generator — ported from v1 index.html CONFIG_FILES (deploy/* section)
// Logic source: lines 7513-7939 of index.html
// Generates: ArgoCD app, Kustomize base + overlays, Helm chart files, deploy/README.md

import type { PipelineConfig } from '../lib/types';

// ── Stack metadata (port + label only, used in deploy files) ─────────────────

interface StackPortMeta {
  label?:      string;
  port?:       string;
  healthPath?: string;
}

const FRONTEND_META: Record<string, StackPortMeta> = {
  nextjs:       { label: 'Next.js 15',         port: '3000', healthPath: '/api/health' },
  react:        { label: 'React SPA',          port: '80',   healthPath: '/' },
  vue:          { label: 'Vue 3',              port: '80',   healthPath: '/' },
  angular:      { label: 'Angular 18',         port: '80',   healthPath: '/' },
  svelte:       { label: 'SvelteKit',          port: '3000', healthPath: '/api/health' },
  nuxt:         { label: 'Nuxt 3',             port: '3000', healthPath: '/api/health' },
  remix:        { label: 'Remix 2',            port: '3000', healthPath: '/api/health' },
  'react-vite': { label: 'React + Vite',       port: '80',   healthPath: '/' },
  gatsby:       { label: 'Gatsby 5',           port: '80',   healthPath: '/' },
  'vue-vite':   { label: 'Vue 3 + Vite',       port: '80',   healthPath: '/' },
  astro:        { label: 'Astro 4',            port: '3000', healthPath: '/' },
  solid:        { label: 'SolidStart',         port: '3000', healthPath: '/api/health' },
  'solid-vite': { label: 'Solid + Vite',       port: '80',   healthPath: '/' },
  qwik:         { label: 'Qwik City',          port: '3000', healthPath: '/health' },
  tanstack:     { label: 'TanStack Start',     port: '3000', healthPath: '/health' },
  'preact-vite':{ label: 'Preact + Vite',      port: '80',   healthPath: '/' },
  lit:          { label: 'Lit (Web Components)',port: '80',   healthPath: '/' },
  redwood:      { label: 'RedwoodJS',          port: '8910', healthPath: '/.redwood/functions/healthz' },
  fresh:        { label: 'Fresh (Deno)',        port: '8000', healthPath: '/health' },
};

const BACKEND_META: Record<string, StackPortMeta> = {
  none:            { label: 'None' },
  nodejs:          { label: 'Node.js',          port: '3000', healthPath: '/api/health' },
  go:              { label: 'Go',               port: '8080', healthPath: '/health' },
  python:          { label: 'Python',           port: '8000', healthPath: '/health' },
  java:            { label: 'Java (Spring)',     port: '8080', healthPath: '/actuator/health' },
  dotnet:          { label: '.NET',             port: '8080', healthPath: '/health' },
  rust:            { label: 'Rust',             port: '8080', healthPath: '/health' },
  ruby:            { label: 'Ruby',             port: '3000', healthPath: '/health' },
  php:             { label: 'PHP',              port: '8000', healthPath: '/health' },
  'nodejs-express':{ label: 'Express',          port: '3000', healthPath: '/health' },
  'nodejs-fastify':{ label: 'Fastify',          port: '3000', healthPath: '/health' },
  'nodejs-nest':   { label: 'NestJS',           port: '3000', healthPath: '/health' },
  'nodejs-hono':   { label: 'Hono',             port: '3000', healthPath: '/health' },
  'python-fastapi':{ label: 'FastAPI',          port: '8000', healthPath: '/health' },
  'python-django': { label: 'Django',           port: '8000', healthPath: '/health/' },
  'python-flask':  { label: 'Flask',            port: '5000', healthPath: '/health' },
  'python-litestar':{ label: 'Litestar',        port: '8000', healthPath: '/health' },
  'java-spring':   { label: 'Spring Boot 3',    port: '8080', healthPath: '/actuator/health' },
  'java-quarkus':  { label: 'Quarkus',          port: '8080', healthPath: '/q/health' },
  'java-micronaut':{ label: 'Micronaut',        port: '8080', healthPath: '/health' },
  'go-gin':        { label: 'Go + gin',         port: '8080', healthPath: '/health' },
  'go-echo':       { label: 'Go + echo',        port: '8080', healthPath: '/health' },
  'go-chi':        { label: 'Go + chi',         port: '8080', healthPath: '/health' },
  'go-stdlib':     { label: 'Go stdlib',        port: '8080', healthPath: '/health' },
  'go-fiber':      { label: 'Go + fiber',       port: '8080', healthPath: '/health' },
  'rust-axum':     { label: 'Axum',             port: '8080', healthPath: '/health' },
  'rust-actix':    { label: 'Actix-web',        port: '8080', healthPath: '/health' },
  'rust-rocket':   { label: 'Rocket',           port: '8000', healthPath: '/health' },
  'rust-warp':     { label: 'Warp',             port: '8080', healthPath: '/health' },
  'ruby-rails':    { label: 'Rails 7',          port: '3000', healthPath: '/health' },
  'ruby-sinatra':  { label: 'Sinatra',          port: '4567', healthPath: '/health' },
  'php-laravel':   { label: 'Laravel 11',       port: '8000', healthPath: '/health' },
  'php-symfony':   { label: 'Symfony 7',        port: '8000', healthPath: '/health' },
  'php-slim':      { label: 'Slim 4',           port: '8000', healthPath: '/health' },
  'nodejs-koa':    { label: 'Koa',              port: '3000', healthPath: '/health' },
  'elixir-phoenix':{ label: 'Phoenix',          port: '4000', healthPath: '/health' },
  'kotlin-ktor':   { label: 'Ktor',             port: '8080', healthPath: '/health' },
  'bun-elysia':    { label: 'Elysia (Bun)',      port: '3000', healthPath: '/health' },
  'deno-fresh-api':{ label: 'Fresh API (Deno)',  port: '8000', healthPath: '/health' },
  'python-starlette':{ label: 'Starlette',      port: '8000', healthPath: '/health' },
  'java-javalin':  { label: 'Javalin',          port: '7070', healthPath: '/health' },
  'swift-vapor':   { label: 'Vapor (Swift)',     port: '8080', healthPath: '/health' },
  'elixir-live':   { label: 'Phoenix LiveView',  port: '4000', healthPath: '/health' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveDeployContext(config: PipelineConfig): {
  app:        string;
  port:       string;
  healthPath: string;
  stackTag:   string;
  cd:         string;
  gitops:     string;
  sameRepo:   boolean;
} {
  const fe = FRONTEND_META[config.feKey]  ?? {};
  const be = BACKEND_META[config.beKey]   ?? {};

  const port       = config.port       ?? be.port       ?? fe.port       ?? '8080';
  const healthPath = config.healthPath ?? be.healthPath ?? fe.healthPath ?? '/health';
  const app        = config.appName ?? 'myapp';
  const cd         = config.cd      ?? 'argocd';
  const gitops     = config.gitops  ?? 'same-repo';
  const sameRepo   = gitops === 'same-repo';

  const feLbl = fe.label;
  const beLbl = be.label;
  const stackTag = [feLbl, beLbl]
    .filter((l): l is string => !!l && l !== 'None')
    .join(' + ') || 'generic';

  return { app, port, healthPath, stackTag, cd, gitops, sameRepo };
}

// ── Individual file generators ────────────────────────────────────────────────

function genArgoCDApp(config: PipelineConfig): string {
  const { app, cd, gitops, sameRepo } = resolveDeployContext(config);

  if (cd !== 'argocd') {
    return `# Not emitted — current CD tool is ${cd}.\n# Switch CD to ArgoCD to emit this file.`;
  }

  const repoURL = sameRepo
    ? 'https://github.com/YOUR_ORG/YOUR_APP_REPO'
    : 'https://github.com/YOUR_ORG/YOUR_CONFIG_REPO';
  const path = sameRepo ? 'deploy/overlays/dev' : 'overlays/dev';

  return `# ArgoCD Application — bootstrap with:
#   kubectl apply -n argocd -f deploy/argocd-app.yaml
# Then ArgoCD pulls + reconciles automatically on every commit.
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ${app}-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: ${repoURL}
    targetRevision: main
    path: ${path}
  destination:
    server: https://kubernetes.default.svc
    namespace: ${app}-dev
  syncPolicy:
    automated: { prune: true, selfHeal: true }
    syncOptions: [ "CreateNamespace=true" ]
`;
}

function genBaseKustomization(config: PipelineConfig): string {
  const app = config.appName ?? 'myapp';
  return `# Base kustomization — referenced by every overlay.
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml
images:
  - name: ${app}
    newName: REGISTRY/${app}           # set by CI's "Bump image digest" step
    digest: sha256:DIGEST               # digest-pinned, never a tag (I-3)
`;
}

function genBaseDeployment(config: PipelineConfig): string {
  const { app, port, healthPath, stackTag } = resolveDeployContext(config);
  return `# Base Deployment. Overlays patch replicas + env per environment.
# Configured for: ${stackTag} · containerPort ${port} · readiness ${healthPath}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${app}
  labels: { app: ${app} }
spec:
  replicas: 2
  selector:
    matchLabels: { app: ${app} }
  template:
    metadata:
      labels: { app: ${app} }
    spec:
      # securityContext + readOnlyRootFilesystem match common admission policies
      securityContext:
        runAsNonRoot: true
        seccompProfile: { type: RuntimeDefault }
      containers:
        - name: ${app}
          image: ${app}                # rewritten by kustomize image transformer
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: ${port}
          resources:
            requests: { cpu: "100m", memory: "128Mi" }
            limits:   { cpu: "500m", memory: "512Mi" }
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities: { drop: ["ALL"] }
          readinessProbe:
            httpGet: { path: ${healthPath}, port: ${port} }
            initialDelaySeconds: 3
            periodSeconds: 5
`;
}

function genBaseService(config: PipelineConfig): string {
  const { app, port, stackTag } = resolveDeployContext(config);
  return `# Configured for: ${stackTag} · targetPort ${port}
apiVersion: v1
kind: Service
metadata:
  name: ${app}
spec:
  selector: { app: ${app} }
  ports:
    - port: 80
      targetPort: ${port}
      protocol: TCP
`;
}

function genOverlayKustomization(
  config: PipelineConfig,
  env: 'dev' | 'staging' | 'prod',
): string {
  const app      = config.appName ?? 'myapp';
  const replicas = env === 'dev' ? 1 : env === 'staging' ? 3 : 10;
  return `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: ${app}-${env}
resources:
  - ../../base
replicas:
  - name: ${app}
    count: ${replicas}
patches:
  - target: { kind: Deployment, name: ${app} }
    patch: |
      - op: add
        path: /spec/template/spec/containers/0/env
        value:
          - name: ENV
            value: ${env}
`;
}

function genDeployReadme(config: PipelineConfig): string {
  const { cd, gitops, sameRepo } = resolveDeployContext(config);

  if (gitops === 'push') {
    return `# Deploy — push mode (no GitOps)

You picked **push deploy**. CI runs \`helm upgrade\` directly from the
main workflow. No drift detection, no auto-sync, no audit trail.

## What you need before the first deploy
1. \`kubectl\` configured for your target cluster (cluster admin gave you a kubeconfig)
2. Helm 3 installed in your CI runner
3. A namespace for each environment: \`kubectl create ns myapp-dev myapp-staging myapp-prod\`
4. Your platform team has installed the admission policies (signed-image, allowed-registries) — see the **Cluster prerequisites** strip on the home page.

## Switch to GitOps before production
Push-deploy is for prototypes. Before any real traffic, switch the
\`GitOps repo layout\` decision to **same-repo** or **separate-repo**.
`;
  }

  const cdLabel = cd === 'argocd' ? 'ArgoCD' : 'Flux';

  return `# Deploy — ${cdLabel} (${sameRepo ? 'same-repo' : 'separate-repo'})

This directory holds the K8s manifests ${cdLabel} watches.

\`\`\`
deploy/
├── base/                       # one source of truth — patched per env by overlays
│   ├── kustomization.yaml
│   ├── deployment.yaml
│   └── service.yaml
├── overlays/
│   ├── dev/kustomization.yaml      # replicas=1, ENV=dev
│   ├── staging/kustomization.yaml  # replicas=3, ENV=staging
│   └── prod/kustomization.yaml     # replicas=10, ENV=prod
└── argocd-app.yaml             # the Application that points at the right overlay
\`\`\`

## One-time bootstrap

${sameRepo
  ? `**Same-repo layout** — the manifests above live in this app repo, in this \`deploy/\` directory. CI builds + pushes the image; ArgoCD watches \`deploy/overlays/<env>/\` and reconciles on every commit.

\`\`\`bash
# 1. Ensure ArgoCD is installed (platform team usually owns this)
kubectl get ns argocd || kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 2. Tell ArgoCD to watch this repo
kubectl apply -n argocd -f deploy/argocd-app.yaml

# 3. Watch the sync
argocd app get myapp-dev
\`\`\``
  : `**Separate-repo layout** — these manifests belong in a config repo (e.g. \`YOUR_ORG/k8s-config\`). Your CI builds the image in the app repo, then opens a PR against the config repo to bump \`base/kustomization.yaml\`'s image digest. ArgoCD watches the config repo.

\`\`\`bash
# 1. Copy this deploy/ tree into your config repo at the path matching argocd-app.yaml's "path"

# 2. From the config repo:
kubectl apply -n argocd -f argocd-app.yaml

# 3. App-repo CI needs write access to config repo to open digest-bump PRs
\`\`\``}

## Image-digest update flow
CI's "Promote :latest" step writes the new \`sha256:DIGEST\` into
\`base/kustomization.yaml\` (\`images[0].digest\`).
${sameRepo ? 'Commits to this repo.' : 'Opens a PR against the config repo.'}
ArgoCD's PreSync hook runs \`cosign verify\` on the digest before any pod schedules — if the signature is missing or the identity doesn't match \`YOUR_ORG/YOUR_REPO/.github/workflows/*\`, sync fails closed (I-20).
`;
}

function genChartYaml(config: PipelineConfig): string {
  const app = config.appName ?? 'myapp';
  return `apiVersion: v2
name: ${app}
description: Application chart — emitted by pipeline-studio.
type: application
version: 0.1.0       # bump when chart structure changes
appVersion: "1.0.0"  # bump per release; CI rewrites this to the image digest
`;
}

function genChartValues(config: PipelineConfig): string {
  const { app, port, healthPath, stackTag } = resolveDeployContext(config);
  return `# Default values. Override per environment with -f values-<env>.yaml or --set.
# Configured for: ${stackTag} · targetPort ${port} · readiness ${healthPath}
# Chart directory should be named '${app}' to match Chart.yaml.
image:
  repository: REGISTRY/${app}    # set by CI: --set image.repository=...
  digest: sha256:DIGEST           # set by CI: --set image.digest=...
  pullPolicy: IfNotPresent

replicaCount: 2

service:
  type: ClusterIP
  port: 80
  targetPort: ${port}

# Security context matches the admission policies your platform team enforces.
podSecurityContext:
  runAsNonRoot: true
  seccompProfile:
    type: RuntimeDefault

containerSecurityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop: ["ALL"]

resources:
  requests: { cpu: "100m", memory: "128Mi" }
  limits:   { cpu: "500m", memory: "512Mi" }

env: dev   # overridden per environment

probes:
  readiness:
    path: ${healthPath}
    initialDelaySeconds: 3
    periodSeconds: 5
`;
}

// Helm templates are static (no config interpolation) — match v1 exactly.
const HELM_DEPLOYMENT_TEMPLATE = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  labels:
    app: {{ .Release.Name }}
    chart: {{ .Chart.Name }}-{{ .Chart.Version }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels: { app: {{ .Release.Name }} }
  template:
    metadata:
      labels: { app: {{ .Release.Name }} }
    spec:
      securityContext:
        {{- toYaml .Values.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ .Release.Name }}
          image: "{{ .Values.image.repository }}@{{ .Values.image.digest }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.service.targetPort }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          securityContext:
            {{- toYaml .Values.containerSecurityContext | nindent 12 }}
          env:
            - name: ENV
              value: {{ .Values.env | quote }}
          readinessProbe:
            httpGet:
              path: {{ .Values.probes.readiness.path }}
              port: {{ .Values.service.targetPort }}
            initialDelaySeconds: {{ .Values.probes.readiness.initialDelaySeconds }}
            periodSeconds: {{ .Values.probes.readiness.periodSeconds }}
`;

const HELM_SERVICE_TEMPLATE = `apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}
spec:
  type: {{ .Values.service.type }}
  selector: { app: {{ .Release.Name }} }
  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
      protocol: TCP
`;

const HELM_VALUES_DEV = `# Dev overrides. helm upgrade ... -f values.yaml -f values-dev.yaml
replicaCount: 1
env: dev
resources:
  requests: { cpu: "50m",  memory: "64Mi" }
  limits:   { cpu: "250m", memory: "256Mi" }
`;

const HELM_VALUES_STAGING = `# Staging overrides. helm upgrade ... -f values.yaml -f values-staging.yaml
replicaCount: 3
env: staging
resources:
  requests: { cpu: "100m", memory: "128Mi" }
  limits:   { cpu: "500m", memory: "512Mi" }
`;

const HELM_VALUES_PROD = `# Prod overrides. helm upgrade ... -f values.yaml -f values-prod.yaml
replicaCount: 10
env: prod
resources:
  requests: { cpu: "200m", memory: "256Mi" }
  limits:   { cpu: "1000m", memory: "1Gi" }
# Pod disruption budget — keep at least N pods during voluntary disruption
podDisruptionBudget:
  enabled: true
  minAvailable: 7
`;

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate all deploy manifest files.
 *
 * Returns a Record where keys are file paths (relative to repo root)
 * and values are file contents — exactly what v1 produces in CONFIG_FILES.
 */
export function generateDeploy(config: PipelineConfig): Record<string, string> {
  const app = config.appName ?? 'myapp';

  return {
    // ArgoCD Application
    'deploy/argocd-app.yaml':                              genArgoCDApp(config),

    // Kustomize base
    'deploy/base/kustomization.yaml':                      genBaseKustomization(config),
    'deploy/base/deployment.yaml':                         genBaseDeployment(config),
    'deploy/base/service.yaml':                            genBaseService(config),

    // Kustomize overlays
    'deploy/overlays/dev/kustomization.yaml':              genOverlayKustomization(config, 'dev'),
    'deploy/overlays/staging/kustomization.yaml':          genOverlayKustomization(config, 'staging'),
    'deploy/overlays/prod/kustomization.yaml':             genOverlayKustomization(config, 'prod'),

    // README
    'deploy/README.md':                                    genDeployReadme(config),

    // Helm chart
    [`deploy/charts/${app}/Chart.yaml`]:                   genChartYaml(config),
    [`deploy/charts/${app}/values.yaml`]:                  genChartValues(config),
    [`deploy/charts/${app}/templates/deployment.yaml`]:    HELM_DEPLOYMENT_TEMPLATE,
    [`deploy/charts/${app}/templates/service.yaml`]:       HELM_SERVICE_TEMPLATE,
    [`deploy/charts/${app}/values-dev.yaml`]:              HELM_VALUES_DEV,
    [`deploy/charts/${app}/values-staging.yaml`]:          HELM_VALUES_STAGING,
    [`deploy/charts/${app}/values-prod.yaml`]:             HELM_VALUES_PROD,
  };
}
