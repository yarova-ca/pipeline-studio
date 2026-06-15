import { json } from '@sveltejs/kit'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Reports the active industry profile from the shared compliance/*.yaml.
// Switch with COMPLIANCE_PROFILE — the recipe changes with no code change.
export function GET() {
  const profile = (process.env.COMPLIANCE_PROFILE ?? 'baseline').toLowerCase()
  if (profile === 'baseline') return json({ profile, required: {} })
  try {
    const text = readFileSync(join(process.cwd(), 'compliance', `${profile}.yaml`), 'utf8')
    const required = {}
    let inBlock = false
    for (const line of text.split('\n')) {
      if (line.startsWith('required_controls:')) { inBlock = true; continue }
      if (inBlock) {
        const m = line.match(/^\s*-\s*([a-z_]+):\s*(.+?)\s*$/)
        if (m) {
          const raw = m[2].replace(/^["']|["']$/g, '')
          required[m[1]] = raw === 'true' ? true : raw === 'false' ? false : /^\d+$/.test(raw) ? Number(raw) : raw
        } else if (/^\S/.test(line)) break
      }
    }
    return json({ profile, required })
  } catch {
    return json({ profile, required: {} })
  }
}
