// Shared types — single source of truth so the whole studio agrees on what
// a Stage / Decision / Invariant / ComplianceKey actually is.
// Killed bugs from v1: DECISION_NODE_MAP vs DECISION_AFFECTS_NODES drift,
// orphan r1/r2/r3/r4 leftovers, untyped INVARIANT_DEPENDS_ON keys.

export type PhaseNumber = 0 | 1 | 2 | 3 | 4;

export type StageId = string;          // 'l1' | 's0' | 's2m' | 's14' | 'p1' …
export type DecisionId = string;       // 'ci' | 'reg' | 'cd' | 'gitops' | …
export type InvariantId = `I-${number}`;
export type ComplianceKey =
  | 'pci' | 'hipaa' | 'fedramp' | 'soc2' | 'gdpr'
  | 'iso27001' | 'cmmc' | 'canadapb' | 'nistcsf' | 'ferpa'
  | 'nerccip' | 'hitrust' | 'none';

export type PhaseTabId =
  | 'tab-phase0' | 'tab-local' | 'tab-pr' | 'tab-main' | 'tab-promotions';

export interface PhaseDef {
  label: string;
  badge: string;
  color: string;
  stageIds: StageId[];
}

export interface DecisionOption {
  value: string;
  label: string;
  desc: string;
  caps?: string[];
  pickWhen?: string;
  avoid?: string;
  tradeoff?: string;
  cost?: string;
}

export interface DecisionDef {
  label: string;
  icon: string;
  concept: string;
  defaultVal: string;
  options?: DecisionOption[];
  selectId?: string;   // when the decision is backed by a config-bar <select>
  why?: string;        // why this decision matters (longer explanation)
  skipWhen?: string;   // when it's safe to skip
}

export interface Invariant {
  id: InvariantId;
  text: string;
  enforced: string;    // stage label, e.g., 'S3: Static Analysis'
  incident: string;    // real-world breach example
}

export interface ComplianceControl {
  control: string;        // e.g. '6.4.4'
  title: string;          // human-readable
  satisfiedBy: InvariantId[];
}

export interface IndustryDef {
  label: string;
  suggestedCompliance: ComplianceKey;
  suggestedCompliance2?: ComplianceKey;
  sla: string;
  traffic: string;
  sensitivity: string;
  note: string;
}

// Concrete user-pick state. All three views (decision map, SVG, phase tabs)
// derive from this. Replaces v1's getConfig() spaghetti.
export interface PipelineConfig {
  feKey: string;
  beKey: string;
  ciKey: string;
  regKey: string;
  compliance: ComplianceKey;
  compliance2: ComplianceKey;
  industry: string;
  cd: string;
  gitops: 'same-repo' | 'separate-repo' | 'push';
  scanner: string;
  signing: string;
  sbom: string;
  baseimage: string;
  pkgMgr: string;
  appName: string;
  port?: string;
  healthPath?: string;
}
