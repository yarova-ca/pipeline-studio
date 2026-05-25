// 20 pipeline invariants — rules that must hold for every release.
// Each maps to the stage that enforces it (for the SVG cross-ref) and an
// optional set of decisions whose 'none' value disables it (for the
// compliance × stage ✓/◐/✗ logic).

import type { Invariant, InvariantId, DecisionId } from './types';

export const INVARIANTS: readonly Invariant[] = [
  { id: 'I-1',  text: 'No long-lived credentials anywhere',          enforced: 'Phase 0: OIDC setup',          incident: 'CodeCov bash uploader (2021)' },
  { id: 'I-2',  text: 'Every commit passes pre-commit hooks',        enforced: 'S1: Pre-commit Hooks',         incident: 'event-stream npm (2018)' },
  { id: 'I-3',  text: 'No HIGH/CRITICAL dep CVE ships',              enforced: 'S2: Dependency Audit',         incident: 'Log4Shell (CVE-2021-44228)' },
  { id: 'I-4',  text: 'No OWASP Top-10 code pattern ships',          enforced: 'S3: Static Analysis',          incident: 'Equifax 2017 (Struts CVE-2017-5638)' },
  { id: 'I-5',  text: 'No privileged containers, no hostPath',       enforced: 'S4: IaC Scan',                 incident: 'Tesla K8s pwn (2018)' },
  { id: 'I-6',  text: 'No secrets in git history',                   enforced: 'S5: Secret Scan',              incident: 'Uber 2016 (AWS keys in repo)' },
  { id: 'I-7',  text: 'Multi-stage, non-root, distroless image',     enforced: 'S6: Docker Build',             incident: 'Capital One 2019' },
  { id: 'I-8',  text: 'Every prod image signed + SBOM attested',     enforced: 'S8: SBOM + Signing',           incident: 'SolarWinds Orion (2020)' },
  { id: 'I-9',  text: 'Test coverage does not decrease on merge',    enforced: 'S9: Test Suite',               incident: 'Knight Capital 2012' },
  { id: 'I-10', text: 'SLSA Level 3 provenance on every prod image', enforced: 'S10: SLSA Provenance',         incident: 'SolarWinds (substituted build step)' },
  { id: 'I-11', text: 'No :latest tags in K8s manifests',            enforced: 'S4: IaC Scan + CD',            incident: 'GitLab class (2017)' },
  { id: 'I-12', text: 'No :latest tag pushed to registry',           enforced: 'S6: Docker Build',             incident: 'Same class as I-11' },
  { id: 'I-13', text: 'Base images from approved registries only',   enforced: 'Phase 0 + S4',                 incident: 'Docker Hub typosquat 2018' },
  { id: 'I-14', text: 'All CI action/image refs pinned to SHA',      enforced: 'Phase 0 review',               incident: 'tj-actions/changed-files (2025)' },
  { id: 'I-15', text: 'Dep auto-update PRs require review',          enforced: 'Phase 0: branch protection',   incident: 'ua-parser-js (2021)' },
  { id: 'I-16', text: 'Deployed image provenance verified at admission', enforced: 'S14: Sig Verify',          incident: 'PyPI ctx package (2022)' },
  { id: 'I-17', text: 'No untrusted fork code runs with secrets',    enforced: 'Phase 0: branch protection',   incident: 'pwn-request pattern' },
  { id: 'I-18', text: 'All creds OIDC-derived; no long-lived tokens',enforced: 'Phase 0: OIDC setup',          incident: 'Codecov 2021 (4-month access)' },
  { id: 'I-19', text: 'Vuln allowlist entries expire ≤90 days',      enforced: 'S7: .trivyignore',             incident: 'Equifax (Struts on wishlist 2 months)' },
  { id: 'I-20', text: 'All admission policies fail-closed',          enforced: 'S14 + platform admission (out of scope)', incident: 'Cryptojacking 2018 (fail-open admission)' }
] as const;

export const INVARIANT_BY_ID: Record<InvariantId, Invariant> =
  Object.fromEntries(INVARIANTS.map(i => [i.id, i])) as Record<InvariantId, Invariant>;

/**
 * For the compliance × stage ✓/◐/✗ logic: which decisions, when set to
 * 'none', disable each invariant. An invariant with no deps is always
 * 'enforced' (phase-0 / always-on rules). v1's logic was "all controls met"
 * always; this gives auditors a true picture.
 */
export const INVARIANT_DEPENDS_ON: Partial<Record<InvariantId, DecisionId[]>> = {
  'I-2':  ['precommit'],
  'I-3':  ['scanner'],
  'I-4':  ['scanner'],
  'I-5':  ['scanner'],
  'I-6':  ['localsecret'],
  'I-8':  ['signing', 'sbom'],
  'I-10': ['signing'],
  'I-13': ['baseimage'],
  'I-16': ['signing'],
  'I-19': ['scanner'],
  'I-20': ['signing']
};
