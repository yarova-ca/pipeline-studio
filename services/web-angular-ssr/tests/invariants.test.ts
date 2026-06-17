import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { buildApp } from '../src/server.app';

// Invariant suite for the Angular SSR golden service (Tier B).
// Tier B holds the SERVER invariants on its Express SSR server PLUS the
// cheaply-testable CLIENT invariants on its source/document.
//
// SSR adaptation: server.ts imports `@angular/ssr/node`, which pulls in the
// Angular runtime and cannot load under a plain Node test process (it needs
// AOT/JIT compilation). The Angular-free Express app — which carries every
// server invariant — was extracted to src/server.app.ts. Tests boot that real
// app on an ephemeral port and exercise it over real HTTP. No route logic is
// re-implemented here.
//
// The protected routes forward the cookie token to a BFF. A second tiny
// express server stands in for the BFF, controlled per-token, so `fetch`
// stays real end to end.

const ROOT = process.cwd();

let bff: Server;
let bffUrl: string;
let appServer: Server;
let baseUrl: string;

function listen(server: Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, () => resolve((server.address() as AddressInfo).port));
  });
}

beforeAll(async () => {
  // Stub BFF: accepts a "valid.token", rejects everything else with 401.
  const stub = express();
  stub.use(express.json());
  function ok(req: express.Request): boolean {
    return req.headers.authorization === 'Bearer valid.token';
  }
  stub.get('/health/ready', (_req, res) => res.json({ status: 'ok' }));
  stub.get('/users/me', (req, res) =>
    ok(req) ? res.json({ id: 'u1', displayName: 'Rohith' }) : res.status(401).json({ error: 'no' }),
  );
  stub.patch('/users/me', (req, res) =>
    ok(req) ? res.json({ id: 'u1', displayName: req.body.displayName }) : res.status(401).json({ error: 'no' }),
  );
  const bffPort = await listen((bff = createServer(stub)));
  bffUrl = `http://127.0.0.1:${bffPort}`;

  const app = buildApp({ bffUrl });
  const appPort = await listen((appServer = createServer(app)));
  baseUrl = `http://127.0.0.1:${appPort}`;
});

afterAll(() => {
  appServer?.close();
  bff?.close();
});

describe('web-angular-ssr invariants', () => {
  // -------- I-3: protected server route, NO auth → 401 --------
  it('I-3: GET /api/users/me with no auth cookie → 401', async () => {
    const r = await fetch(`${baseUrl}/api/users/me`);
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ error: 'Unauthorized' });
  });

  // -------- I-4: protected server route, garbage/tampered token → 401 --------
  it('I-4: GET /api/users/me with a tampered token the BFF rejects → 401', async () => {
    const r = await fetch(`${baseUrl}/api/users/me`, {
      headers: { cookie: 'access_token=tampered.garbage.token' },
    });
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ error: 'Unauthorized' });
  });

  it('I-4 control: a valid token the BFF accepts → 200 passthrough', async () => {
    const r = await fetch(`${baseUrl}/api/users/me`, {
      headers: { cookie: 'access_token=valid.token' },
    });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ id: 'u1' });
  });

  // -------- I-6: write with VALID token + unknown extra field → 400 --------
  it('I-6: PATCH /api/users/me with a valid token + unknown field → 400 (unknown rejected)', async () => {
    const r = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PATCH',
      headers: { cookie: 'access_token=valid.token', 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Rohith', isAdmin: true }),
    });
    expect(r.status).toBe(400);
    const body = await r.json();
    expect(String(body.error)).toMatch(/unknown field/i);
  });

  it('I-6 control: a valid token + only known fields → 200 forwarded', async () => {
    const r = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PATCH',
      headers: { cookie: 'access_token=valid.token', 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Rohith' }),
    });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ displayName: 'Rohith' });
  });

  it('I-6/I-3: PATCH with an unknown field but NO auth → 401 (auth precedes validation)', async () => {
    const r = await fetch(`${baseUrl}/api/users/me`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isAdmin: true }),
    });
    expect(r.status).toBe(401);
  });

  // -------- I-10: health/liveness route → 200 --------
  it('I-10: GET /health/live → 200 ok', async () => {
    const r = await fetch(`${baseUrl}/health/live`);
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ status: 'ok' });
  });

  // -------- I-13: metrics route → 200 with request-duration golden signal --------
  it('I-13: GET /api/metrics → 200 with http_request_duration_seconds', async () => {
    // Make at least one prior request so the histogram has samples.
    await fetch(`${baseUrl}/health/live`);
    const r = await fetch(`${baseUrl}/api/metrics`);
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toMatch(/text\/plain/);
    const text = await r.text();
    expect(text).toContain('http_request_duration_seconds');
    expect(text).toMatch(/http_request_duration_seconds_bucket/);
  });

  // -------- I-17: x-content-type-options: nosniff on every response --------
  it('I-17: every response carries x-content-type-options: nosniff', async () => {
    for (const path of ['/health/live', '/api/metrics', '/api/users/me']) {
      const r = await fetch(`${baseUrl}${path}`);
      expect(r.headers.get('x-content-type-options'), `path ${path}`).toBe('nosniff');
    }
  });

  // -------- C-6: served document sets CSP + framing protections --------
  it('C-6: responses set a Content-Security-Policy and framing protections', async () => {
    const r = await fetch(`${baseUrl}/health/live`);
    const csp = r.headers.get('content-security-policy') ?? '';
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(r.headers.get('x-frame-options')).toBe('DENY');
  });

  // -------- C-1: no secret reaches the client bundle --------
  // Client source = browser-bundled code: src/ minus server-only files
  // (server.ts, server.app.ts, main.server.ts, *.server.ts). Secret-bearing
  // env (JWT_SECRET, SESSION_SECRET, BFF_URL, AUTH_CLIENT_SECRET) and the
  // access_token must never appear in client source; client env must be
  // PUBLIC_/NG_APP_ prefixed.
  it('C-1: no secret-bearing env in client source; only PUBLIC_/NG_APP_ env allowed', () => {
    const SECRET_PATTERNS = [
      /JWT_SECRET/,
      /SESSION_SECRET/,
      /AUTH_CLIENT_SECRET/,
      /process\.env\[?['"]?BFF_URL/,
      /access_token/,
    ];
    const SERVER_ONLY = /(?:^|[\\/])(server\.ts|server\.app\.ts|main\.server\.ts|.*\.server\.ts|compliance\.ts)$/;

    const clientFiles: string[] = [];
    const srcDir = join(ROOT, 'src');
    function walk(dir: string) {
      for (const name of readdirSync(dir)) {
        if (name.startsWith('.')) continue;
        const full = join(dir, name);
        if (statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|js|mjs|html)$/.test(name)) continue;
        if (SERVER_ONLY.test(full)) continue;
        clientFiles.push(full);
      }
    }
    walk(srcDir);
    expect(clientFiles.length).toBeGreaterThan(0);

    for (const f of clientFiles) {
      const src = readFileSync(f, 'utf8');
      for (const pat of SECRET_PATTERNS) {
        expect(pat.test(src), `secret pattern ${pat} found in client file ${f}`).toBe(false);
      }
      const envRefs = src.match(/(?:process\.env|import\.meta\.env)[.[]['"]?([A-Z0-9_]+)/g) ?? [];
      for (const ref of envRefs) {
        const name = (ref.match(/([A-Z0-9_]+)$/) ?? [])[1] ?? '';
        expect(
          /^(PUBLIC_|NG_APP_)/.test(name),
          `client env ${name} in ${f} is not PUBLIC_/NG_APP_-prefixed`,
        ).toBe(true);
      }
    }
  });
});
