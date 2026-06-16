import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { activeCompliance } from '../src/compliance'

// The loader reads compliance/profiles.json from process.cwd() and caches it.
// vitest runs with cwd at the bff package root, so the path resolves the same
// way it does in production.
const PROFILES = JSON.parse(
  readFileSync(join(process.cwd(), 'compliance', 'profiles.json'), 'utf8'),
) as {
  device: string
  profiles: Record<string, {
    name: string; jurisdiction: string
    controls: Record<string, string | number | boolean>
  }>
}

describe('compliance profiles.json catalog', () => {
  it('every profile shares the exact same uniform set of control keys', () => {
    const ids = Object.keys(PROFILES.profiles)
    expect(ids.length).toBeGreaterThan(0)
    const baseKeys = Object.keys(PROFILES.profiles[ids[0]].controls).sort()
    for (const id of ids) {
      const keys = Object.keys(PROFILES.profiles[id].controls).sort()
      expect(keys, `profile "${id}" control keys must match the uniform set`).toEqual(baseKeys)
    }
  })

  it('itsg-33 enforces Canadian data residency and FIPS crypto', () => {
    const itsg = PROFILES.profiles['itsg-33']
    expect(itsg, 'itsg-33 profile must exist').toBeDefined()
    expect(itsg.controls.data_residency).toBe('canada')
    expect(itsg.controls.fips_crypto).toBe(true)
  })
})

describe('compliance loader (activeCompliance)', () => {
  const original = process.env.COMPLIANCE_PROFILE

  beforeEach(() => {
    delete process.env.COMPLIANCE_PROFILE
  })

  afterEach(() => {
    if (original === undefined) delete process.env.COMPLIANCE_PROFILE
    else process.env.COMPLIANCE_PROFILE = original
  })

  it('selecting itsg-33 returns the itsg-33 profile and its controls', () => {
    // activeCompliance() reads COMPLIANCE_PROFILE on every call, so setting it
    // here is enough — only the parsed JSON file is cached, not the env.
    process.env.COMPLIANCE_PROFILE = 'itsg-33'
    const view = activeCompliance()
    expect(view.profile).toBe('itsg-33')
    expect(view.name).toBe(PROFILES.profiles['itsg-33'].name)
    expect(view.jurisdiction).toBe(PROFILES.profiles['itsg-33'].jurisdiction)
    expect(view.controls.data_residency).toBe('canada')
    expect(view.controls.fips_crypto).toBe(true)
  })
})
