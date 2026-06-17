import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Invariant under test: one repo serves every industry. Same controls, just on/off.
// The profiles come from the canonical catalog, generated to profiles.json.

const data = JSON.parse(
  readFileSync(join(process.cwd(), 'compliance', 'profiles.json'), 'utf8'),
)
const profiles = data.profiles as Record<string, { controls: Record<string, unknown> }>

describe('compliance catalog — uniform, device-filtered', () => {
  it('every profile exposes the SAME control keys — same for all, just on/off', () => {
    const baseKeys = Object.keys(profiles.baseline.controls).sort()
    for (const [id, p] of Object.entries(profiles)) {
      expect(Object.keys(p.controls).sort(), `profile ${id} key drift`).toEqual(baseKeys)
    }
  })

  it('ITSG-33 (Protected B) enforces Canadian residency + FIPS crypto', () => {
    expect(profiles['itsg-33'].controls.data_residency).toBe('canada')
    expect(profiles['itsg-33'].controls.fips_crypto).toBe(true)
  })
})

describe('runtime switch — COMPLIANCE_PROFILE flips the profile', () => {
  beforeEach(() => { delete process.env.COMPLIANCE_PROFILE })

  it('selecting itsg-33 returns itsg-33 with no rebuild', async () => {
    process.env.COMPLIANCE_PROFILE = 'itsg-33'
    const { activeCompliance } = await import('../src/compliance')
    const view = activeCompliance()
    expect(view.profile).toBe('itsg-33')
    expect(view.controls.data_residency).toBe('canada')
    expect(view.controls.fips_crypto).toBe(true)
  })
})
