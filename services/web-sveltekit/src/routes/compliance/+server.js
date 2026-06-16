import { json } from '@sveltejs/kit'
import { activeCompliance } from '$lib/compliance.js'

// Reports the active industry profile from the shared compliance/profiles.json.
// Switch with COMPLIANCE_PROFILE — the recipe changes with no code change.
export function GET() {
  return json(activeCompliance())
}
