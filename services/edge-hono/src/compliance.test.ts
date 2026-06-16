import { describe, it, expect } from 'vitest'
import profilesFile from '../compliance/profiles.json'
import { activeCompliance } from './compliance'

// The compliance catalog is uniform: every profile carries the same control
// keys, so a control either exists everywhere or nowhere. These invariants
// guard against a profile drifting out of the shared shape, and against the
// regulated values for a named profile being silently weakened.

const profiles = (profilesFile as any).profiles as Record<
  string,
  { controls: Record<string, unknown> }
>

describe('compliance catalog invariants', () => {
  it('every profile shares the identical set of control keys', () => {
    const ids = Object.keys(profiles)
    expect(ids.length).toBeGreaterThan(0)

    const reference = Object.keys(profiles[ids[0]].controls).sort()
    expect(reference.length).toBeGreaterThan(0)

    for (const id of ids) {
      const keys = Object.keys(profiles[id].controls).sort()
      expect(keys, `profile ${id} control keys`).toEqual(reference)
    }
  })

  it('itsg-33 enforces Canadian data residency', () => {
    const itsg = profiles['itsg-33']
    expect(itsg, 'itsg-33 profile must exist').toBeTruthy()
    expect(itsg.controls.data_residency).toBe('canada')
    // fips_crypto is NOT an edge control: Cloudflare Workers cannot use a FIPS base image.
    expect(itsg.controls.fips_crypto).toBeUndefined()
  })

  it('selecting itsg-33 returns that profile', () => {
    const view = activeCompliance({ COMPLIANCE_PROFILE: 'itsg-33' })
    expect(view.profile).toBe('itsg-33')
    expect(view.name).toBe((profilesFile as any).profiles['itsg-33'].name)
    expect(view.controls).toEqual(profiles['itsg-33'].controls)
  })
})
