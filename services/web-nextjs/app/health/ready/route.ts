import { NextResponse } from 'next/server'
import { bffUrl } from '../../../src/config'

// I-10: readiness is true only when the BFF (which owns the DB) is reachable.
// The SSR app has no database of its own; its dependency is the BFF.
export async function GET() {
  try {
    const res = await fetch(`${bffUrl()}/health/ready`, {
      signal: AbortSignal.timeout(2000),
      cache: 'no-store',
    })
    if (res.ok) {
      return NextResponse.json({ status: 'ok', bff: 'reachable' })
    }
    return NextResponse.json({ status: 'error', bff: 'unhealthy' }, { status: 503 })
  } catch {
    return NextResponse.json({ status: 'error', bff: 'unreachable' }, { status: 503 })
  }
}

