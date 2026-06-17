import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const m = JSON.parse(readFileSync(join(process.cwd(), 'integrations', 'integrations.json'), 'utf8'))

describe('integration manifest', () => {
  it('ships Canada + common systems with auth + config keys', () => {
    expect(m.canada.length).toBeGreaterThanOrEqual(8)
    expect(m.common.length).toBeGreaterThanOrEqual(6)
    for (const i of [...m.canada, ...m.common]) {
      expect(i.auth, `${i.id} needs an auth pattern`).toBeTruthy()
      expect(i.config_keys.length, `${i.id} needs config keys`).toBeGreaterThan(0)
    }
  })
  it('includes the Canadian identity + payments systems', () => {
    const ids = m.canada.map((i: { id: string }) => i.id)
    expect(ids).toContain('int-gckey')
    expect(ids).toContain('int-interac')
  })
})
