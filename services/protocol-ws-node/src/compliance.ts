import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// One repo serves every industry. The active profile is chosen at runtime by
// COMPLIANCE_PROFILE — no code change, no rebuild. The profiles come from the
// platform's canonical catalog (compliance/profiles.json), generated to JSON so
// there is no per-language YAML parsing.

export interface ComplianceView {
  profile: string
  name: string
  jurisdiction: string
  // Uniform control set for this device type. Same keys for every profile.
  controls: Record<string, string | number | boolean>
}

interface ProfilesFile {
  device: string
  catalogVersion: number
  controlMeta: Record<string, { label: string; type: string }>
  profiles: Record<string, {
    name: string; priority: string; jurisdiction: string
    controls: Record<string, string | number | boolean>
  }>
}

let cache: ProfilesFile | null = null
function loadProfiles(): ProfilesFile | null {
  if (cache) return cache
  try {
    cache = JSON.parse(
      readFileSync(join(process.cwd(), 'compliance', 'profiles.json'), 'utf8'),
    ) as ProfilesFile
    return cache
  } catch {
    return null
  }
}

export function activeCompliance(): ComplianceView {
  const profile = (process.env.COMPLIANCE_PROFILE ?? 'baseline').toLowerCase()
  const data = loadProfiles()
  const p = data?.profiles[profile] ?? data?.profiles.baseline
  if (!p) return { profile, name: 'unknown', jurisdiction: '', controls: {} }
  return { profile, name: p.name, jurisdiction: p.jurisdiction, controls: p.controls }
}
