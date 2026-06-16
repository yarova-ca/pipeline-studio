import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { activeCompliance } from './compliance'

// Read the raw catalog directly so the test verifies the source of truth,
// not the loader's cache. The loader is exercised separately below.
const raw = JSON.parse(
  readFileSync(join(process.cwd(), 'compliance', 'profiles.json'), 'utf8'),
) as {
  device: string
  controlMeta: Record<string, unknown>
  profiles: Record<string, {
    name: string; priority: string; jurisdiction: string
    controls: Record<string, string | number | boolean>
  }>
}

describe('compliance catalog invariants', () => {
  it('every profile shares the exact same control keys', () => {
    const ids = Object.keys(raw.profiles)
    expect(ids.length).toBeGreaterThan(0)

    const reference = Object.keys(raw.profiles[ids[0]].controls).sort()
    expect(reference.length).toBeGreaterThan(0)

    for (const id of ids) {
      const keys = Object.keys(raw.profiles[id].controls).sort()
      expect(keys, `profile "${id}" control keys must match the uniform set`).toEqual(reference)
    }
  })

  it('control keys match the declared controlMeta keys', () => {
    const metaKeys = Object.keys(raw.controlMeta).sort()
    const ids = Object.keys(raw.profiles)
    const controlKeys = Object.keys(raw.profiles[ids[0]].controls).sort()
    expect(controlKeys).toEqual(metaKeys)
  })

  it('itsg-33 enforces Canadian data residency and FIPS crypto', () => {
    const itsg = raw.profiles['itsg-33']
    expect(itsg, 'itsg-33 profile must exist').toBeDefined()
    // This device's Canada-residency signal is the profile priority field.
    // There is no separate data_residency control key in the protocol catalog.
    expect(itsg.priority).toBe('canada')
    expect(itsg.controls.fips_crypto).toBe(true)
  })
})

describe('activeCompliance loader', () => {
  beforeEach(() => {
    delete process.env.COMPLIANCE_PROFILE
  })

  it('selecting itsg-33 returns the itsg-33 profile', () => {
    process.env.COMPLIANCE_PROFILE = 'itsg-33'
    const view = activeCompliance()
    expect(view.profile).toBe('itsg-33')
    expect(view.name).toBe(raw.profiles['itsg-33'].name)
    expect(view.jurisdiction).toBe(raw.profiles['itsg-33'].jurisdiction)
    expect(view.controls.fips_crypto).toBe(true)
  })

  it('defaults to baseline when COMPLIANCE_PROFILE is unset', () => {
    const view = activeCompliance()
    expect(view.profile).toBe('baseline')
    expect(view.name).toBe(raw.profiles['baseline'].name)
  })
})
