// Yarova platform invariant suite for the WebSocket (ws) protocol server.
//
// Each test maps to a runtime invariant by I-id. The server speaks WebSocket
// over an HTTP upgrade, so auth/validation invariants are asserted at the
// protocol level:
//   - auth = an upgrade without a valid token is refused (HTTP 401, no socket)
//   - input validation = an upgrade to a non-/ws route is refused (HTTP 404)
//
// The suite boots the real exported `server` on an ephemeral port and drives it
// with a real `ws` client. The JWT is minted exactly how the server verifies it.

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { AddressInfo } from 'node:net'
import jwt from 'jsonwebtoken'
import WebSocket from 'ws'

// I-1 requires JWT_SECRET >= 32 chars; src/test-setup.ts sets it before import.
const TEST_SECRET = process.env.JWT_SECRET as string

import { server } from './index'

let port = 0

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve))
  port = (server.address() as AddressInfo).port
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

// Minted exactly how the server verifies it: HS256 over JWT_SECRET.
const validToken = () =>
  jwt.sign({ id: 'u1', email: 'u1@yarova.ca', name: 'User One' }, TEST_SECRET, {
    expiresIn: '8h',
  })

// Opens a ws connection and resolves with how it ended:
//   { opened: true, ... }      — handshake succeeded
//   { opened: false, code }    — handshake rejected (HTTP status on `unexpected-response`)
function connect(
  path: string,
  headers: Record<string, string> = {},
): Promise<{ opened: boolean; status?: number; ws?: WebSocket }> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`, { headers })
    ws.once('open', () => resolve({ opened: true, ws }))
    ws.once('unexpected-response', (_req, res) => {
      resolve({ opened: false, status: res.statusCode })
      ws.terminate()
    })
    ws.once('error', () => resolve({ opened: false }))
  })
}

describe('WebSocket protocol invariants', () => {
  // I-3: auth required — an upgrade with NO token is refused (HTTP 401), no socket.
  it('I-3: WS upgrade without a token is refused with HTTP 401', async () => {
    const r = await connect('/ws')
    expect(r.opened).toBe(false)
    expect(r.status).toBe(401)
  })

  // I-3 positive control: a valid token completes the handshake and echoes.
  it('I-3: WS upgrade WITH a valid token opens and echoes the message', async () => {
    const r = await connect('/ws', { authorization: `Bearer ${validToken()}` })
    expect(r.opened).toBe(true)
    const ws = r.ws!
    const echoed = await new Promise<any>((resolve, reject) => {
      ws.once('message', (m) => resolve(JSON.parse(m.toString())))
      ws.once('error', reject)
      ws.send('hello')
    })
    expect(echoed.echo).toBe('hello')
    expect(echoed.userId).toBe('u1')
    ws.close()
  })

  // I-4: bad token rejected — a garbage Bearer token is refused like no token.
  it('I-4: WS upgrade with a garbage token is refused with HTTP 401', async () => {
    const r = await connect('/ws', { authorization: 'Bearer not.a.real.jwt' })
    expect(r.opened).toBe(false)
    expect(r.status).toBe(401)
  })

  // I-4: a token signed with the WRONG secret is also refused.
  it('I-4: WS upgrade with a wrong-secret token is refused with HTTP 401', async () => {
    const forged = jwt.sign(
      { id: 'evil', email: 'e@e', name: 'e' },
      'a-totally-different-secret-32-characters!',
    )
    const r = await connect('/ws', { authorization: `Bearer ${forged}` })
    expect(r.opened).toBe(false)
    expect(r.status).toBe(401)
  })

  // I-6: input validation — protocol equivalent.
  // The only input the server validates BEFORE establishing a connection is the
  // upgrade route. An upgrade to a non-/ws path is refused with HTTP 404.
  // (The post-connect echo handler accepts any byte payload by design — there is
  // no message-level schema to over-run, so the validation surface is the route.)
  it('I-6: WS upgrade to a non-/ws route is refused with HTTP 404', async () => {
    const r = await connect('/not-ws', {
      authorization: `Bearer ${validToken()}`,
    })
    expect(r.opened).toBe(false)
    expect(r.status).toBe(404)
  })

  // I-10: liveness — GET /health/live returns 200.
  it('I-10: GET /health/live returns 200', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health/live`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  // I-13: metrics — GET /metrics returns 200 with the request-duration golden signal.
  it('I-13: GET /metrics returns 200 with http_request_duration_seconds', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/metrics`)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('http_request_duration_seconds')
  })

  // I-17: security headers — HTTP responses carry x-content-type-options: nosniff.
  it('I-17: HTTP responses carry x-content-type-options: nosniff', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health/live`)
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
})
