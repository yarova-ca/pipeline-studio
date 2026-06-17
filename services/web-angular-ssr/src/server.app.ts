import express, { type Express } from 'express';
import * as client from 'prom-client';
import { activeCompliance } from './compliance';

// Full-stack SSR (Tier B). This module builds the Express app that holds every
// server invariant: security headers, golden-signal metrics, health/liveness,
// and the protected, strictly-validated API routes. Data and auth live in a
// BFF reached via BFF_URL.
//
// SSR adaptation: the Angular SSR catch-all (which pulls in the Angular runtime
// and cannot load under a plain Node test process) lives in server.ts. This
// module is deliberately Angular-free so the invariants can be exercised by an
// HTTP test without booting Angular.

export interface BuildAppOptions {
  bffUrl: string;
}

// I-6: only known fields are accepted on a write. Unknown fields → 400.
// Explicit allowlist == zod .strict() equivalent, kept dependency-free.
const ALLOWED_USER_PATCH_FIELDS = new Set(['displayName']);

export function buildApp(opts: BuildAppOptions): Express {
  const bffUrl = opts.bffUrl;

  const registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry });
  const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'status'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry],
  });

  const app = express();
  const startedAt = Date.now();

  app.use(express.json());

  // I-17 + C-6: security headers and a CSP on every response.
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; frame-ancestors 'none'",
    );
    next();
  });

  // I-13: measure every request's duration.
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      if (req.path !== '/api/metrics') {
        httpDuration
          .labels(req.method, String(res.statusCode))
          .observe(Number(process.hrtime.bigint() - start) / 1e9);
      }
    });
    next();
  });

  // I-10: liveness is true whenever the process is up.
  app.get('/health/live', (_req, res) => {
    res.json({ status: 'ok', uptime_s: Math.round((Date.now() - startedAt) / 1000) });
  });

  // I-10: readiness is true only when the BFF (which owns the DB) is reachable.
  app.get('/health/ready', async (_req, res) => {
    try {
      const r = await fetch(`${bffUrl}/health/ready`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) {
        res.json({ status: 'ok', bff: 'reachable' });
        return;
      }
      res.status(503).json({ status: 'error', bff: 'unhealthy' });
    } catch {
      res.status(503).json({ status: 'error', bff: 'unreachable' });
    }
  });

  // I-13: Prometheus scrape endpoint.
  app.get('/api/metrics', async (_req, res) => {
    res.setHeader('Content-Type', registry.contentType);
    res.send(await registry.metrics());
  });

  // Active industry profile and its controls.
  app.get('/compliance', (_req, res) => res.json(activeCompliance()));

  function readToken(req: express.Request): string | undefined {
    const cookie = req.headers.cookie ?? '';
    return cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('access_token='))
      ?.slice('access_token='.length);
  }

  // I-3/I-4: a protected route. The token lives in an httpOnly cookie (C-4);
  // the SSR forwards it to the BFF. No token → 401, no call to the BFF.
  // A tampered token is rejected by the BFF → 401.
  app.get('/api/users/me', async (req, res) => {
    const token = readToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      const r = await fetch(`${bffUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      res.json(await r.json());
    } catch {
      res.status(502).json({ error: 'Bad gateway' });
    }
  });

  // I-6: a protected write. Valid token required (else 401). Unknown extra
  // fields are rejected (else 400) before anything reaches the BFF.
  app.patch('/api/users/me', async (req, res) => {
    const token = readToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const body = req.body as Record<string, unknown> | undefined;
    if (body === undefined || body === null || typeof body !== 'object' || Array.isArray(body)) {
      res.status(400).json({ error: 'Body must be a JSON object' });
      return;
    }
    const unknown = Object.keys(body).filter((k) => !ALLOWED_USER_PATCH_FIELDS.has(k));
    if (unknown.length > 0) {
      res.status(400).json({ error: `Unknown field(s): ${unknown.join(', ')}` });
      return;
    }
    if (typeof body['displayName'] !== 'string' || (body['displayName'] as string).length === 0) {
      res.status(400).json({ error: 'displayName must be a non-empty string' });
      return;
    }
    try {
      const r = await fetch(`${bffUrl}/users/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: body['displayName'] }),
      });
      if (!r.ok) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      res.json(await r.json());
    } catch {
      res.status(502).json({ error: 'Bad gateway' });
    }
  });

  return app;
}
