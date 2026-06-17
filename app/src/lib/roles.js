// lib/roles.js — the ROLE CONSOLE.
// Each role is a full operable page: mission, owns, does (with cadence),
// decides (real ADRs), layers worked, definition of done, dispatch-to-AI.
// You step into a role and run it. Director + Lead are the deepest.

// The platform's sequenced layers (the paved road). Roles reference these.
export const LAYERS_SEQ = [
  ['L0', 'Product & intake', 'a builder asks for a golden path'],
  ['L1', 'Framework & service', 'the app — 106 frameworks, 22 real'],
  ['L2', 'Local dev & pre-commit', 'how code starts, first gates'],
  ['L3', 'CI pipeline', 'phases → stages → tools'],
  ['L4', 'Security & compliance gates', 'scans + the compliance flip'],
  ['L5', 'Registry & supply chain', 'push · sign · SBOM'],
  ['L6', 'GitOps & promotion', 'ArgoCD dev → test → prod'],
  ['L7', 'Clusters & runtime', 'multi-cloud hub-and-spoke'],
  ['L8', 'Observability & SRE', 'metrics · SLOs · on-call'],
  ['L9', 'Lifecycle & maintenance', 'patch · upgrade · version'],
];

// adr id helper — links into the existing ADR chapter
const ADR = (n, title) => ({ id: `adr-${n}`, label: `ADR-${n}`, title });

const ROLES = [
  {
    id: 'director', n: 1, title: 'Director of Platform Engineering',
    mission: 'Own the 1–3 year platform direction and the trade-offs behind it.',
    plain: 'The person who decides what the platform supports next, and why.',
    owns: [
      'The roadmap — what frameworks, clouds, and capabilities ship next.',
      'The budget and headcount for the platform team.',
      'Every Architecture Decision Record (final sign-off).',
      'The platform’s definition of “done” (the invariants bar).',
    ],
    does: [
      { when: 'Quarterly', task: 'Pick the next supported stack or cloud → record it as an ADR.' },
      { when: 'Quarterly', task: 'Review the layer status (L0–L9): what is real code vs designed.' },
      { when: 'Monthly', task: 'Approve or reject proposed ADRs from the team.' },
      { when: 'Weekly', task: 'Unblock the Lead; remove the one thing slowing delivery.' },
    ],
    decides: [
      ADR('0001', 'Golden repos: one real repo per framework'),
      ADR('0006', 'Canonical compliance catalog, one flag'),
      ADR('0008', 'Invariants as the definition of done'),
      ADR('0012', 'The studio is a knowledge guide'),
    ],
    decidesNote: 'Final sign-off on all 12 ADRs. The four above are the strategy-defining ones.',
    layers: ['L0','L1','L2','L3','L4','L5','L6','L7','L8','L9'],
    layersNote: 'Sees every layer’s status. Owns none day-to-day; accountable for all.',
    dod: [
      'Every supported framework has a real, green golden repo.',
      'Every cloud the platform claims is a runnable cluster repo.',
      'No EOL runtime ships (the lifecycle layer holds).',
    ],
    dispatch: [
      'Draft an ADR to add <framework/cloud> as a supported golden path.',
      'Produce a one-page status of L0–L9: real code vs designed, with gaps.',
      'Compare two candidate stacks for <use case> and recommend one, with trade-offs.',
    ],
  },
  {
    id: 'lead', n: 2, title: 'Platform Engineering Lead',
    mission: 'Turn the roadmap into shipped, working platform capability — on time.',
    plain: 'The person who runs delivery and keeps the team unblocked.',
    owns: [
      'The team backlog and its priority order.',
      'Delivery cadence — what ships this sprint.',
      'The hand-off between roles (who does what next).',
      'Quality gates before a capability is called done.',
    ],
    does: [
      { when: 'Each sprint', task: 'Break the next roadmap item into tasks, each with a failing test.' },
      { when: 'Daily', task: 'Clear blockers; reassign work; keep the critical path moving.' },
      { when: 'Per capability', task: 'Confirm the invariants + CI gates pass before marking done.' },
      { when: 'Weekly', task: 'Report progress + risks up to the Director.' },
    ],
    decides: [
      ADR('0009', 'Ship both Helm and Kustomize per service'),
      ADR('0011', 'Security gates report, not block, in the template'),
    ],
    decidesNote: 'Owns delivery-shape decisions; escalates strategy to the Director.',
    layers: ['L0','L1','L2','L3','L4','L5','L6','L7','L8','L9'],
    layersNote: 'Coordinates work across every layer; owns the sequence of delivery.',
    dod: [
      'Every task ships with a passing test (no “Claude says done”).',
      'STATE.md updated; the green CI run is the proof.',
      'The capability works end to end, not just in isolation.',
    ],
    dispatch: [
      'Open the next roadmap item as tasks, each with a failing test path.',
      'Audit which of L0–L9 are blocked and why; propose the unblock order.',
      'Roll <capability> across all 22 services and report per-service status.',
    ],
  },
  {
    id: 'idp', n: 3, title: 'Platform / IDP Engineer',
    mission: 'Build the golden paths so a developer ships without filing tickets.',
    plain: 'IDP = Internal Developer Platform (self-service tooling).',
    owns: [
      'The golden-path templates (one per framework).',
      'This studio — the knowledge + console itself.',
      'The scaffolding that creates a new pe-<category>-<framework> repo.',
    ],
    does: [
      { when: 'Per new framework', task: 'Scaffold the golden repo from the template; wire its 7 CI workflows.' },
      { when: 'Ongoing', task: 'Keep the studio accurate as the platform changes.' },
      { when: 'Per request', task: 'Add a self-service path so builders avoid manual setup.' },
    ],
    decides: [
      ADR('0001', 'Golden repos: one real repo per framework'),
      ADR('0002', 'Repo naming: pe-<category>-<framework>'),
      ADR('0012', 'The studio is a knowledge guide'),
    ],
    layers: ['L0','L1','L2'],
    dod: [
      'A new repo builds green from the template with zero manual fixes.',
      'The studio reflects the real code (no stale claims).',
    ],
    dispatch: [
      'Scaffold pe-<category>-<framework> from the golden template + 7 CI workflows.',
      'Add a studio chapter/page for <new capability> wired to real data.',
    ],
  },
  {
    id: 'devops', n: 4, title: 'DevOps Engineer',
    mission: 'Wire build → test → deploy as one automated pipeline every repo uses.',
    plain: 'CI/CD = the automated build-and-ship pipeline. IaC = infra defined in files.',
    owns: [
      'The CI pipeline — 6 phases, the stages and tools.',
      'Infrastructure-as-code automation.',
      'The promotion wiring (PR → environment).',
    ],
    does: [
      { when: 'Per repo', task: 'Keep the 7 CI workflows green and identical across services.' },
      { when: 'Per change', task: 'Add or fix a pipeline stage across all services at once.' },
      { when: 'Ongoing', task: 'Remove flakiness; keep build times down.' },
    ],
    decides: [
      ADR('0004', 'GitOps with ArgoCD as the only deploy path'),
      ADR('0009', 'Ship both Helm and Kustomize per service'),
    ],
    layers: ['L2','L3','L6'],
    dod: [
      'Every service runs the same green pipeline.',
      'No manual deploy step exists — everything is automated.',
    ],
    dispatch: [
      'Add CI stage <X> to all 22 service workflows and verify green.',
      'Diagnose the failing <workflow> across services and fix the root cause.',
    ],
  },
  {
    id: 'devsecops', n: 5, title: 'DevSecOps Engineer',
    mission: 'Make sure nothing ships unscanned, unsigned, or out of compliance.',
    plain: 'SCA = scans dependencies. SAST = scans your code. SBOM = the ingredient list.',
    owns: [
      'The security gates — SCA, SAST, secrets, signing, SBOM.',
      'The compliance catalog and the per-regime flip.',
      'The supply chain — image signing + SBOM attestation.',
    ],
    does: [
      { when: 'Per release', task: 'Confirm the image is signed (cosign) + SBOM attached (Syft).' },
      { when: 'Per industry', task: 'Flip the compliance regime via COMPLIANCE_PROFILE; verify controls.' },
      { when: 'Ongoing', task: 'Tune scan policy; remediate or accept CVEs with a record.' },
    ],
    decides: [
      ADR('0005', 'Keyless image signing (cosign) + SBOM (Syft)'),
      ADR('0006', 'Canonical compliance catalog, one flag'),
      ADR('0007', 'Per-device compliance scoping'),
      ADR('0011', 'Security gates report, not block'),
    ],
    layers: ['L4','L5'],
    dod: [
      'Every shipped image is signed and has an SBOM.',
      'The active compliance regime’s controls all hold.',
    ],
    dispatch: [
      'Roll a Trivy/Semgrep policy change across all services + report findings.',
      'Add compliance regime <X> to the catalog and wire its controls per device.',
    ],
  },
  {
    id: 'sre', n: 6, title: 'SRE — Site Reliability Engineer',
    mission: 'Keep it up, handle incidents, and tune performance.',
    plain: 'SLO = a measurable reliability target. Observability = seeing what the app does.',
    owns: [
      'Reliability — SLOs and error budgets.',
      'Observability — metrics, logs, traces.',
      'On-call and incident response; safe rollouts.',
    ],
    does: [
      { when: 'Per service', task: 'Define an SLO + alert; confirm the golden-signal metrics export.' },
      { when: 'Per incident', task: 'Respond, mitigate, write the post-incident note.' },
      { when: 'Per rollout', task: 'Watch the deploy; roll back on a breached error budget.' },
    ],
    decides: [
      ADR('0008', 'Invariants as the definition of done'),
    ],
    decidesNote: 'Owns the runtime invariants (health, metrics, graceful shutdown).',
    layers: ['L7','L8'],
    dod: [
      'Every service exposes /health and the four golden-signal metrics.',
      'Every service has an SLO and an alert.',
    ],
    dispatch: [
      'Add an SLO + Prometheus alert for service <X>.',
      'Verify the I-10/I-13 invariants (health + metrics) across all 22 services.',
    ],
  },
  {
    id: 'cloud', n: 7, title: 'Cloud / Infrastructure Engineer',
    mission: 'Provide and tune the clusters apps land on.',
    plain: 'The person who owns the runtime: clusters, networking, identity, cost.',
    owns: [
      'The cluster repos — EKS, GKE, AKS, OpenShift.',
      'Networking, workload identity, and cost.',
      'The hub-and-spoke topology.',
    ],
    does: [
      { when: 'Per cloud', task: 'Keep the cluster Terraform current; terraform validate green.' },
      { when: 'Quarterly', task: 'Bump Kubernetes + provider versions to supported releases.' },
      { when: 'Ongoing', task: 'Tune cost, identity, and network guardrails.' },
    ],
    decides: [
      ADR('0003', 'Hub-and-spoke cluster topology'),
      ADR('0010', 'Multi-cloud via Terraform modules behind one interface'),
    ],
    layers: ['L7'],
    dod: [
      'Every cloud is a runnable cluster repo, terraform validate green.',
      'No EOL Kubernetes version runs (1.34 now).',
    ],
    dispatch: [
      'Bump pe-cluster-* to Kubernetes <version> + terraform validate all roots.',
      'Add a new spoke environment to pe-cluster-<cloud> and validate.',
    ],
  },
  {
    id: 'release', n: 8, title: 'Release / Delivery Engineer',
    mission: 'Move code safely from dev to test to prod.',
    plain: 'GitOps = git is the source of truth; ArgoCD syncs git → cluster.',
    owns: [
      'Promotions across the four environments.',
      'The GitOps repo and ArgoCD app definitions.',
      'The cosign-verify gate before a promotion lands.',
    ],
    does: [
      { when: 'Per promotion', task: 'Open the GitOps PR; ArgoCD syncs; verify signature + env tests.' },
      { when: 'Per release', task: 'Tag and sign the release; record what is running where.' },
      { when: 'On failure', task: 'Roll back the environment via git revert.' },
    ],
    decides: [
      ADR('0004', 'GitOps with ArgoCD as the only deploy path'),
    ],
    layers: ['L6'],
    dod: [
      'Every promotion is a git change ArgoCD applied — no manual kubectl.',
      'Every environment’s running version is known and signed.',
    ],
    dispatch: [
      'Promote service <X> from dev to test via a GitOps PR.',
      'Roll back environment <env> for service <X> to the last good version.',
    ],
  },
  {
    id: 'product', n: 9, title: 'Product / Application Developer',
    mission: 'Pick a golden path and write features. The platform does the rest.',
    plain: 'This is the consumer — the person the whole platform serves.',
    consumer: true,
    owns: [
      'Their application code — nothing else.',
    ],
    does: [
      { when: 'Once', task: 'Request a golden path for the framework they need.' },
      { when: 'Daily', task: 'Write features; the pipeline tests, secures, and ships them.' },
      { when: 'Never', task: 'Set up CI, signing, compliance, or clusters — the platform owns that.' },
    ],
    decides: [],
    decidesNote: 'Makes no platform decisions; consumes the paved road.',
    layers: ['L0','L1'],
    dod: [
      'Their feature ships green through the existing pipeline.',
      'They never touched infrastructure.',
    ],
    dispatch: [
      'Add feature <Y> to service <X> using its existing golden path.',
      'Scaffold a new endpoint in service <X> with a passing test.',
    ],
  },
];

export function roleConsole() {
  return ROLES.map(r => ({ id: r.id, n: r.n, title: r.title, plain: r.plain, consumer: !!r.consumer }));
}
export function rolePage(id) {
  return ROLES.find(r => r.id === id) || null;
}
export function layersSeq() { return LAYERS_SEQ; }
