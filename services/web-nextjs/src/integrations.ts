import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Integration registry. One repo can connect to every listed external system.
// Each integration ships a placeholder client + example endpoint; the developer
// fills the config_keys in the env to activate it. No code change to switch on.

export interface Integration {
  id: string
  name: string
  category: string
  auth: string
  config_keys: string[]
  example_endpoint: string
  verticals: string[]
  status: string
}
interface Manifest { version: number; note: string; canada: Integration[]; common: Integration[] }

let cache: Manifest | null = null
function manifest(): Manifest {
  if (cache) return cache
  cache = JSON.parse(
    readFileSync(join(process.cwd(), 'integrations', 'integrations.json'), 'utf8'),
  ) as Manifest
  return cache
}

export function allIntegrations(): Integration[] {
  const m = manifest()
  return [...m.canada, ...m.common]
}

export function getIntegration(id: string): Integration | undefined {
  return allIntegrations().find(i => i.id === id || i.id === `int-${id}`)
}

// An integration is "configured" when every config key is set in the env.
export function isConfigured(i: Integration): boolean {
  return i.config_keys.every(k => !!process.env[k])
}

// The placeholder client call. Real wiring replaces the body once configured.
export function exampleCall(i: Integration) {
  if (!isConfigured(i)) {
    return {
      integration: i.id,
      configured: false,
      auth: i.auth,
      missing_config: i.config_keys.filter(k => !process.env[k]),
      note: `Set ${i.config_keys.join(', ')} in your env to activate ${i.name}.`,
    }
  }
  return {
    integration: i.id,
    configured: true,
    auth: i.auth,
    note: `${i.name} is configured. Replace exampleCall() with the real ${i.auth} request.`,
  }
}
