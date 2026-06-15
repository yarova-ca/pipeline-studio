import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as yaml from 'js-yaml'

// One repo serves every industry. COMPLIANCE_PROFILE flips a few controls.
// baseline: no regulated controls. hipaa|pci|fedramp|fips|pipeda: load the yaml.
export type Profile = 'baseline' | 'hipaa' | 'pci' | 'fedramp' | 'fips' | 'pipeda'

export interface Controls {
  profile: Profile
  auditLogging: boolean
  sessionTimeoutSeconds: number
  mfaRequired: boolean
  encryptionInTransit: boolean
  required: Record<string, unknown>
}

const BASELINE: Controls = {
  profile: 'baseline',
  auditLogging: false,
  sessionTimeoutSeconds: 8 * 60 * 60,
  mfaRequired: false,
  encryptionInTransit: false,
  required: {},
}

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

function load(profile: Profile): Controls {
  if (profile === 'baseline') return BASELINE
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
}

const raw = (process.env.COMPLIANCE_PROFILE ?? 'baseline').toLowerCase()
const valid: Profile[] = ['baseline', 'hipaa', 'pci', 'fedramp', 'fips', 'pipeda']
if (!valid.includes(raw as Profile)) {
  console.error('FATAL: unknown COMPLIANCE_PROFILE:', raw)
  process.exit(1)
}

// A named profile with no readable file must fail loud, never run insecure.
let loaded: Controls
try {
  loaded = load(raw as Profile)
} catch (err) {
  console.error('FATAL: compliance profile not loadable:', raw, (err as Error).message)
  process.exit(1)
}

export const compliance = loaded
