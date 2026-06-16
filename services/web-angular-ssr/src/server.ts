import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import * as client from 'prom-client';
import { activeCompliance } from './compliance';

const browserDistFolder = join(import.meta.dirname, '../browser');

// Full-stack SSR: this server holds the invariants; data and auth live in a BFF.
const BFF_URL = process.env['BFF_URL'] ?? '';

// I-13: golden-signal metrics.
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
const angularApp = new AngularNodeAppEngine();
const startedAt = Date.now();

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
      httpDuration.labels(req.method, String(res.statusCode)).observe(Number(process.hrtime.bigint() - start) / 1e9);
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
    const r = await fetch(`${BFF_URL}/health/ready`, { signal: AbortSignal.timeout(2000) });
    if (r.ok) { res.json({ status: 'ok', bff: 'reachable' }); return; }
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

// I-3: a protected route. The token lives in an httpOnly cookie (C-4); the SSR
// forwards it to the BFF. No token → 401, no call to the BFF.
app.get('/api/users/me', async (req, res) => {
  const cookie = req.headers.cookie ?? '';
  const token = cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith('access_token='))?.slice('access_token='.length);
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const r = await fetch(`${BFF_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) { res.status(401).json({ error: 'Unauthorized' }); return; }
    res.json(await r.json());
  } catch {
    res.status(502).json({ error: 'Bad gateway' });
  }
});

app.use(express.static(browserDistFolder, { maxAge: '1y', index: false, redirect: false }));

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  // I-1: refuse to boot on missing or weak config.
  if (!BFF_URL || (process.env['SESSION_SECRET'] ?? '').length < 32) {
    console.error('FATAL: BFF_URL must be set and SESSION_SECRET must be at least 32 characters');
    process.exit(1);
  }
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) throw error;
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
