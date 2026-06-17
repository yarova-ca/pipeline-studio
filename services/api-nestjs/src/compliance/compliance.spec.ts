import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// The compliance catalog is generated to compliance/profiles.json, relative to
// process.cwd(). These invariants guard the generation contract: every profile
// must carry the SAME control keys, and the loader must honor COMPLIANCE_PROFILE.
interface ProfileEntry {
  name: string
  priority: string
  jurisdiction: string
  controls: Record<string, string | number | boolean>
}
interface ProfilesFile {
  device: string
  profiles: Record<string, ProfileEntry>
}

function loadFile(): ProfilesFile {
  const file = join(process.cwd(), 'compliance', 'profiles.json')
  return JSON.parse(readFileSync(file, 'utf8')) as ProfilesFile
}

describe('compliance profiles.json invariants', () => {
  it('every profile has the SAME control keys (uniform on/off)', () => {
    const profiles = loadFile().profiles
    const names = Object.keys(profiles)
    expect(names.length).toBeGreaterThan(0)
    const reference = Object.keys(profiles[names[0]].controls).sort()
    for (const name of names) {
      const keys = Object.keys(profiles[name].controls).sort()
      expect(keys).toEqual(reference)
    }
  })

  it('itsg-33 enforces Canadian data residency and FIPS crypto', () => {
    const itsg = loadFile().profiles['itsg-33']
    expect(itsg).toBeDefined()
    expect(itsg.controls.data_residency).toBe('canada')
    expect(itsg.controls.fips_crypto).toBe(true)
  })
})

describe('compliance loader honors COMPLIANCE_PROFILE', () => {
  const original = process.env.COMPLIANCE_PROFILE

  afterEach(() => {
    if (original === undefined) delete process.env.COMPLIANCE_PROFILE
    else process.env.COMPLIANCE_PROFILE = original
    jest.resetModules()
  })

  it('with COMPLIANCE_PROFILE=itsg-33 returns profile "itsg-33"', () => {
    process.env.COMPLIANCE_PROFILE = 'itsg-33'
    jest.resetModules()
    // The loader reads the env var and the file once, at module load.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { compliance } = require('./compliance') as typeof import('./compliance')
    expect(compliance.profile).toBe('itsg-33')
    expect(compliance.name).toBe('ITSG-33 / Protected B (CCCS Medium)')
    expect(compliance.controls.data_residency).toBe('canada')
    expect(compliance.controls.fips_crypto).toBe(true)
    expect(compliance.sessionTimeoutSeconds).toBe(900)
    expect(compliance.auditLogging).toBe(true)
  })
})
