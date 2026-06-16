import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// One repo serves every industry. The active profile is chosen at runtime by
// COMPLIANCE_PROFILE — no code change, no rebuild. The profiles come from the
// platform's canonical catalog, generated to JSON so there is no per-language
// YAML parsing. Every profile exposes the SAME control keys — just on/off.

let cache = null
function loadProfiles() {
  if (cache) return cache
  try {
    cache = JSON.parse(
      readFileSync(join(process.cwd(), 'compliance', 'profiles.json'), 'utf8'),
    )
    return cache
  } catch {
    return null
  }
}

export function activeCompliance() {
  const profile = (process.env.COMPLIANCE_PROFILE ?? 'baseline').toLowerCase()
  const data = loadProfiles()
  const p = data?.profiles[profile] ?? data?.profiles.baseline
  if (!p) return { profile, name: 'unknown', jurisdiction: '', controls: {} }
  return { profile, name: p.name, jurisdiction: p.jurisdiction, controls: p.controls }
}
