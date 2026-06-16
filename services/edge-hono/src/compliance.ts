import profilesFile from '../compliance/profiles.json'

// One repo serves every industry. The active profile is chosen at runtime by
// COMPLIANCE_PROFILE — no code change, no rebuild. The profiles come from the
// platform's canonical catalog, generated to JSON so there is no per-language
// YAML parsing. Cloudflare Workers cannot read files at runtime, so the catalog
// is imported at build time (resolveJsonModule) and bundled into the Worker.

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

const data = profilesFile as ProfilesFile

// Worker env binding (Cloudflare) is passed per-request; process.env is the
// Node fallback. The profile is read once at module load from whatever is set.
function pickProfile(env?: Record<string, unknown>): string {
  const fromEnv = env?.COMPLIANCE_PROFILE
  const fromProcess =
    typeof process !== 'undefined' ? process.env?.COMPLIANCE_PROFILE : undefined
  return String(fromEnv ?? fromProcess ?? 'baseline').toLowerCase()
}

export function activeCompliance(env?: Record<string, unknown>): ComplianceView {
  const profile = pickProfile(env)
  const p = data.profiles[profile] ?? data.profiles.baseline
  if (!p) return { profile, name: 'unknown', jurisdiction: '', controls: {} }
  return { profile, name: p.name, jurisdiction: p.jurisdiction, controls: p.controls }
}

// The active profile resolved at module load — used by middleware and token TTL.
export const compliance = activeCompliance()
