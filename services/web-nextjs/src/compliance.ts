import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The SSR app reads the same compliance/*.yaml the BFF uses, so the UI shows
// the industry recipe for the active profile. One repo serves all industries.
export type Profile = 'baseline' | 'hipaa' | 'pci' | 'fedramp' | 'fips' | 'pipeda'

export interface ComplianceView {
  profile: Profile
  required: Record<string, unknown>
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

// Minimal YAML reader for the flat required_controls list — avoids a dependency
// in the SSR bundle for a tiny, known shape.
function parseRequired(text: string): Record<string, unknown> {
  const list: Array<Record<string, unknown>> = []
  let inBlock = false
  for (const line of text.split('\n')) {
    if (line.startsWith('required_controls:')) { inBlock = true; continue }
    if (inBlock) {
      const m = line.match(/^\s*-\s*([a-z_]+):\s*(.+?)\s*$/)
      if (m) {
        const raw = m[2].replace(/^["']|["']$/g, '')
        const val = raw === 'true' ? true : raw === 'false' ? false : /^\d+$/.test(raw) ? Number(raw) : raw
        list.push({ [m[1]]: val })
      } else if (/^\S/.test(line)) {
        break
      }
    }
  }
  return flatten(list)
}

export function activeCompliance(): ComplianceView {
  const profile = ((process.env.COMPLIANCE_PROFILE ?? 'baseline').toLowerCase()) as Profile
  if (profile === 'baseline') return { profile, required: {} }
  try {
    const text = readFileSync(join(process.cwd(), 'compliance', `${profile}.yaml`), 'utf8')
    return { profile, required: parseRequired(text) }
  } catch {
    return { profile, required: {} }
  }
}
