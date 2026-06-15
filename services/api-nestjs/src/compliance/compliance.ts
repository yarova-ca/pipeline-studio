import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as yaml from 'js-yaml'
import { logger } from '../logger'

// The active industry profile. One repo serves all industries; the profile
// flips a few controls. Switch it with the COMPLIANCE_PROFILE env var alone.
//
// baseline: no regulated-industry controls (default).
// hipaa | pci | fedramp | fips | pipeda: load compliance/<profile>.yaml.
export type ComplianceProfile =
  | 'baseline'
  | 'hipaa'
  | 'pci'
  | 'fedramp'
  | 'fips'
  | 'pipeda'

// The controls the running code actually enforces, derived from the profile.
export interface ComplianceControls {
  profile: ComplianceProfile
  // I-driven runtime effects:
  auditLogging: boolean // log every mutating request with user + action
  sessionTimeoutSeconds: number // becomes the JWT TTL
  mfaRequired: boolean // surfaced as policy; enforced by the auth provider
  encryptionInTransit: boolean // adds HSTS to every response
  // The raw required_controls block, surfaced verbatim for /compliance and the studio.
  required: Record<string, unknown>
}

const BASELINE: ComplianceControls = {
  profile: 'baseline',
  auditLogging: false,
  sessionTimeoutSeconds: 8 * 60 * 60, // 8h default session
  mfaRequired: false,
  encryptionInTransit: false,
  required: {},
}

// required_controls in the yaml is a list of single-key maps:
//   - audit_logging: true
//   - session_timeout: 900
// Flatten it into one object.
function flatten(list: unknown): Record<string, unknown> {
  if (!Array.isArray(list)) return {}
  const out: Record<string, unknown> = {}
  for (const entry of list) {
    if (entry && typeof entry === 'object') {
      for (const [k, v] of Object.entries(entry as Record<string, unknown>)) out[k] = v
    }
  }
  return out
}

function load(profile: ComplianceProfile): ComplianceControls {
  if (profile === 'baseline') return BASELINE
  try {
    const file = join(process.cwd(), 'compliance', `${profile}.yaml`)
    const doc = yaml.load(readFileSync(file, 'utf8')) as { required_controls?: unknown }
    const req = flatten(doc?.required_controls)
    return {
      profile,
      auditLogging: req['audit_logging'] === true,
      sessionTimeoutSeconds:
        typeof req['session_timeout'] === 'number'
          ? (req['session_timeout'] as number)
          : BASELINE.sessionTimeoutSeconds,
      mfaRequired: req['mfa_required'] === true,
      encryptionInTransit: req['encryption_in_transit'] === true,
      required: req,
    }
  } catch (err) {
    // A named profile with no readable file must fail loud — never silently
    // run an industry deployment with the controls missing.
    logger.error({ err, profile }, 'FATAL: compliance profile not loadable')
    process.exit(1)
  }
}

const raw = (process.env.COMPLIANCE_PROFILE ?? 'baseline').toLowerCase()
const valid: ComplianceProfile[] = ['baseline', 'hipaa', 'pci', 'fedramp', 'fips', 'pipeda']
if (!valid.includes(raw as ComplianceProfile)) {
  logger.error({ raw }, 'FATAL: unknown COMPLIANCE_PROFILE')
  process.exit(1)
}

export const compliance: ComplianceControls = load(raw as ComplianceProfile)
logger.info(
  {
    profile: compliance.profile,
    auditLogging: compliance.auditLogging,
    sessionTimeoutSeconds: compliance.sessionTimeoutSeconds,
    mfaRequired: compliance.mfaRequired,
  },
  'compliance profile active',
)
