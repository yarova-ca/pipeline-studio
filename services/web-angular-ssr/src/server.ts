import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { buildApp } from './server.app';

const browserDistFolder = join(import.meta.dirname, '../browser');

// Full-stack SSR: the Express app (security headers, metrics, health, protected
// API routes — every server invariant) is built in server.app.ts. This file
// adds the Angular SSR catch-all and the boot guard.
const BFF_URL = process.env['BFF_URL'] ?? '';

const app = buildApp({ bffUrl: BFF_URL });
const angularApp = new AngularNodeAppEngine();

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
