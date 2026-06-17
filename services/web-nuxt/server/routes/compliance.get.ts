import { activeCompliance } from '../utils/compliance'

// Reports the active industry profile from the shared compliance/profiles.json.
// Switch with COMPLIANCE_PROFILE — the recipe changes with no code change.
export default defineEventHandler(() => activeCompliance())
