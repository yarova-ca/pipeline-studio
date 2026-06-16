import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { logger } from '../logger'

// The active industry profile. One repo serves every industry; the profile
// flips a few controls. Switch it with the COMPLIANCE_PROFILE env var alone —
// no code change, no rebuild.
//
// Profiles come from the platform's canonical catalog, generated to
// compliance/profiles.json. Every profile carries the SAME control keys for
// this device type (uniform on/off), so there is no per-language YAML parsing.

// One profile in the generated catalog.
interface ProfileEntry {
  name: string
  priority: string
  jurisdiction: string
  // Uniform control set for this device type. Same keys for every profile.
  controls: Record<string, string | number | boolean>
}

interface ProfilesFile {
  device: string
  catalogVersion: number
  controlMeta: Record<string, { label: string; type: string }>
  profiles: Record<string, ProfileEntry>
}

// The controls the running code actually enforces, derived from the profile.
export interface ComplianceControls {
  profile: string
  name: string
  jurisdiction: string
  // I-driven runtime effects, derived from the uniform control set:
  auditLogging: boolean // log every mutating request with user + action
  sessionTimeoutSeconds: number // becomes the JWT TTL
  mfaRequired: boolean // surfaced as policy; enforced by the auth provider
  encryptionInTransit: boolean // adds HSTS to every response
  // The full uniform control set, surfaced verbatim for /compliance and the studio.
  controls: Record<string, string | number | boolean>
}

function loadProfiles(): ProfilesFile {
  const file = join(process.cwd(), 'compliance', 'profiles.json')
  return JSON.parse(readFileSync(file, 'utf8')) as ProfilesFile
}

function derive(profile: string, entry: ProfileEntry): ComplianceControls {
  const c = entry.controls
  const timeout = c['session_timeout_seconds']
  return {
    profile,
    name: entry.name,
    jurisdiction: entry.jurisdiction,
    auditLogging: c['audit_logging'] === true,
    sessionTimeoutSeconds:
      typeof timeout === 'number' && timeout > 0 ? timeout : 8 * 60 * 60, // 8h default session
    mfaRequired: c['mfa_required'] === true,
    encryptionInTransit: c['encryption_in_transit'] === true,
    controls: c,
  }
}

function load(): ComplianceControls {
  const profile = (process.env.COMPLIANCE_PROFILE ?? 'baseline').toLowerCase()
  let data: ProfilesFile
  try {
    data = loadProfiles()
  } catch (err) {
    // The generated catalog must be present. Never silently run a deployment
    // with the controls missing.
    logger.error({ err }, 'FATAL: compliance/profiles.json not loadable')
    process.exit(1)
  }
  const entry = data.profiles[profile]
  if (!entry) {
    // A named profile with no entry must fail loud — never silently fall back
    // to baseline for an industry deployment.
    logger.error({ profile, available: Object.keys(data.profiles) }, 'FATAL: unknown COMPLIANCE_PROFILE')
    process.exit(1)
  }
  return derive(profile, entry)
}

export const compliance: ComplianceControls = load()
logger.info(
  {
    profile: compliance.profile,
    auditLogging: compliance.auditLogging,
    sessionTimeoutSeconds: compliance.sessionTimeoutSeconds,
    mfaRequired: compliance.mfaRequired,
  },
  'compliance profile active',
)
