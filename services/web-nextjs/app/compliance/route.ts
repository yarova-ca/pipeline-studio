import { NextResponse } from 'next/server'
import { activeCompliance } from '../../src/compliance'

// Reports the active industry profile and its controls. Switch with
// COMPLIANCE_PROFILE — the recipe changes with no code change, no rebuild.
export async function GET() {
  return NextResponse.json(activeCompliance())
}
