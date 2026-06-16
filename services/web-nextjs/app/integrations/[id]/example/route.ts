import { NextResponse } from 'next/server'
import { getIntegration, exampleCall } from '../../../../src/integrations'

// Example integration endpoint. Shows the auth pattern + whether it is configured.
// One repo, every system: fill the config_keys in the env to activate.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const integration = getIntegration(id)
  if (!integration) {
    return NextResponse.json({ error: `unknown integration: ${id}` }, { status: 404 })
  }
  return NextResponse.json(exampleCall(integration))
}
