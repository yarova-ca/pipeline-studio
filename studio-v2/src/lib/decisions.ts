// Decision definitions, required/optional sets, and decision → affected
// stages map. All typed so adding/removing a decision is a compile error
// everywhere it's referenced. Killed v1's r1/r2/r3/r4 leftovers + the two
// drifting decision-node maps.

import type { DecisionDef, DecisionId, StageId } from './types';

export const DECISION_DEFS: Record<DecisionId, DecisionDef> = {
  shape: {
    label: 'Service shape', icon: '🎯',
    concept: 'What kind of service is this? Shape decides whether the pipeline contains a Dockerfile, K8s manifests, CD steps, or skips them.',
    defaultVal: 'fullstack',
    options: [
      { value: 'fullstack', label: 'Full-stack web app', desc: 'Server-rendered HTML + client JS. Container pipeline.' },
      { value: 'frontend',  label: 'Frontend SPA',       desc: 'Single-page app. nginx serves static files. Needs separate backend.' },
      { value: 'backend',   label: 'Backend API',        desc: 'No UI. Container serves JSON to clients.' },
      { value: 'ssg',       label: 'Static site (SSG)',  desc: 'HTML built at build time. Container with nginx.' },
      { value: 'mobile',    label: 'Mobile app',         desc: 'No container. App store build.' },
      { value: 'library',   label: 'Library / package',  desc: 'No deploy. Publish to npm/PyPI/crates.' }
    ]
  },
  fe: { label: 'Frontend framework', icon: '🌐', concept: 'UI framework — what users see in the browser. Decides Dockerfile + build command + test command.', selectId: 'sel-frontend', defaultVal: 'nextjs' },
  be: { label: 'Backend framework',  icon: '⚙️', concept: 'Server / API code. None means frontend-only mode.',                                            selectId: 'sel-backend',  defaultVal: 'none' },
  ci: { label: 'CI system',          icon: '🔁', concept: 'Where the pipeline actually runs.',                                                              selectId: 'sel-ci',       defaultVal: 'github-actions' },
  reg:{ label: 'Container registry', icon: '📦', concept: 'Where the signed image is pushed.',                                                              selectId: 'sel-reg',      defaultVal: 'ghcr' },
  cd: {
    label: 'CD tool', icon: '🚀',
    concept: 'Continuous Delivery tool. Reads image digest, applies K8s manifests, watches rollout.',
    defaultVal: 'argocd',
    options: [
      { value: 'argocd',    label: 'ArgoCD',         desc: 'GitOps pull. K8s-native. Most popular.' },
      { value: 'flux',      label: 'Flux',           desc: 'GitOps pull. Lightweight. Helm + Kustomize.' },
      { value: 'spinnaker', label: 'Spinnaker',      desc: 'Enterprise multi-cloud push.' },
      { value: 'helm',      label: 'Helm (manual)',  desc: 'Imperative. No GitOps.' },
      { value: 'jenkinsx',  label: 'Jenkins X',      desc: 'Cloud-native Jenkins for K8s.' }
    ]
  },
  gitops: {
    label: 'GitOps repo layout', icon: '📂',
    concept: 'Where K8s manifests live. Same app repo (deploy/ subtree) or a separate config repo.',
    defaultVal: 'same-repo',
    options: [
      { value: 'same-repo',     label: 'Same repo (deploy/ subtree)', desc: 'Manifests live alongside source.' },
      { value: 'separate-repo', label: 'Separate config repo',        desc: 'Best at scale.' },
      { value: 'push',          label: 'Push deploy (no GitOps)',     desc: 'helm upgrade direct from CI. Prototypes only.' }
    ]
  },
  baseimage: { label: 'Container base image', icon: '🐳', concept: 'Foundation layer. Smaller base = smaller attack surface.', defaultVal: 'distroless' },
  scanner:   { label: 'CVE scanner',          icon: '🔍', concept: 'Catches known vulns in image layers.',                       defaultVal: 'trivy' },
  signing:   { label: 'Image signing',        icon: '✍️',  concept: 'Cosign keyless via OIDC.',                                   defaultVal: 'cosign' },
  sbom:      { label: 'SBOM generator',       icon: '📋', concept: 'Software Bill of Materials. Attested with cosign.',          defaultVal: 'syft' },
  pkg:       { label: 'Package manager',      icon: '📦', concept: 'Build artifact format.',                                     defaultVal: 'npm' },
  ide:       { label: 'IDE security hints',   icon: '💡', concept: 'Pre-CI feedback.',                                           defaultVal: 'snyk' },
  precommit: { label: 'Pre-commit framework', icon: '🪝', concept: 'Hook framework.',                                            defaultVal: 'precommit' },
  localsecret:{label: 'Local secret scan',    icon: '🕵️', concept: 'Stop secrets before commit.',                                defaultVal: 'gitleaks' },
  cloud:     { label: 'Cloud target',         icon: '☁️',  concept: 'Cluster cloud provider.',                                    defaultVal: 'aws' },
  promotion: { label: 'Promotion strategy',   icon: '🚦', concept: 'How dev→staging→prod moves.',                                defaultVal: 'canary' },
  industry:  { label: 'Industry sector',      icon: '🏢', concept: 'Drives suggested compliance.',                               selectId: 'sel-industry',   defaultVal: 'none' },
  compliance:{ label: 'Compliance framework', icon: '📜', concept: 'Auditor view: which controls the pipeline satisfies.',       selectId: 'sel-compliance', defaultVal: 'none' }
};

/** Decisions whose pick is essential for a working pipeline → Required badge. */
export const DECISION_REQUIRED: ReadonlySet<DecisionId> = new Set([
  'fe', 'be', 'ci', 'reg', 'cd', 'gitops', 'scanner', 'signing', 'baseimage'
]);
/** Decisions that have a 'none' / auto fallback → Optional badge. */
export const DECISION_OPTIONAL: ReadonlySet<DecisionId> = new Set([
  'ide', 'precommit', 'localsecret', 'pkg', 'sbom', 'cloud', 'promotion', 'industry', 'compliance'
]);

/**
 * Decision → stages whose YAML output changes when this decision changes.
 * Used by the SVG glow on pick + the 'what changed' toast.
 * Single source of truth; v1 had two of these and they drifted.
 */
export const DECISION_AFFECTS_NODES: Record<DecisionId, StageId[]> = {
  ide:               ['l1'],
  precommit:         ['l2'],
  localsecret:       ['l4'],
  fe:                ['s6pr', 's6main'],
  be:                ['s6pr', 's6main'],
  pkg:               ['s2', 's2m', 's6pr', 's6main'],
  ci:                ['s0', 's1'],
  reg:               ['s6main', 's13'],
  cd:                ['p1', 'p2', 'p3', 'p4', 's14'],
  gitops:            ['p1', 'p2', 'p3', 'p4', 's14'],
  baseimage:         ['s6pr', 's6main'],
  sbom:              ['s8apr', 's8a'],
  scanner:           ['s7pr', 's7main'],
  signing:           ['s8b', 's14'],
  cloud:             ['p1'],
  promotion:         ['p2', 'p3', 'p4'],
  industry:          ['s8b', 's10', 's14'],
  compliance:        ['s8b', 's10', 's14']
};
