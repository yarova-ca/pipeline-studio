#!/usr/bin/env python3
"""
generate_middleware.py

Adds structured logging, rate limiting, OTel, and DB-checking /health/ready
to Node/Express services in this monorepo.

Usage:
    python3 scripts/generate_middleware.py [--service <name>] [--dry-run]

Options:
    --service   Target a single service directory (default: all Node services).
    --dry-run   Print changes without writing files.
"""

import argparse
import json
import os
import sys
from pathlib import Path

# ── Middleware snippets injected into src/index.ts ──────────────────────────

LOGGER_IMPORT = "import { logger } from './logger.js'"

LOGGER_MODULE_SRC = """\
import pino from 'pino'

// Structured JSON logger.
// Development: pretty-printed via pino-pretty.
// Production:  raw JSON for log aggregators.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
})
"""

REQUEST_LOG_MIDDLEWARE = """\
// ── Request logging ────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'request')
  next()
})
"""

RATE_LIMIT_IMPORT = "import rateLimit from 'express-rate-limit'"

RATE_LIMIT_MIDDLEWARE = """\
// ── Rate limiting ──────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 60_000,   // 1-minute window
    max: 100,           // 100 requests per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — try again in 60 seconds' },
    skip: (req) => req.path.startsWith('/health'),
  }),
)
"""

TRACING_IMPORT = "import './tracing.js'"

TRACING_MODULE_SRC = """\
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

// OTel SDK — must be started before any other imports.
// Endpoint defaults to local collector; override via OTEL_EXPORTER_OTLP_ENDPOINT.
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
      'http://localhost:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
})

sdk.start()
process.on('SIGTERM', () => sdk.shutdown())
"""

HEALTH_READY_HANDLER = """\
app.get('/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'connected' })
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' })
  }
})"""

PRISMA_IMPORT = "import { prisma } from './db/client.js'"

# ── Dependency additions for package.json ───────────────────────────────────

DEPS_TO_ADD = {
    "pino": "^9.0.0",
    "express-rate-limit": "^7.0.0",
    "@opentelemetry/sdk-node": "^0.52.0",
    "@opentelemetry/auto-instrumentations-node": "^0.49.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.52.0",
}

DEV_DEPS_TO_ADD = {
    "pino-pretty": "^11.0.0",
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def discover_node_services(root: Path) -> list[Path]:
    """Return all service dirs that contain a package.json with Express."""
    result = []
    for svc in sorted((root / "services").iterdir()):
        pkg = svc / "package.json"
        if pkg.exists():
            data = json.loads(pkg.read_text())
            deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
            if "express" in deps:
                result.append(svc)
    return result


def inject_middleware(service_dir: Path, dry_run: bool) -> dict:
    """
    Apply all four middleware changes to a single Node/Express service.
    Returns a dict summarising what was changed.
    """
    changes = {}
    src_dir = service_dir / "src"
    index_path = src_dir / "index.ts"

    if not index_path.exists():
        return {"skipped": "src/index.ts not found"}

    # ── 1. Write src/logger.ts ─────────────────────────────────────────────
    logger_path = src_dir / "logger.ts"
    if not logger_path.exists():
        if not dry_run:
            logger_path.write_text(LOGGER_MODULE_SRC)
        changes["logger.ts"] = "created"
    else:
        changes["logger.ts"] = "already exists"

    # ── 2. Write src/tracing.ts ────────────────────────────────────────────
    tracing_path = src_dir / "tracing.ts"
    if not tracing_path.exists():
        if not dry_run:
            tracing_path.write_text(TRACING_MODULE_SRC)
        changes["tracing.ts"] = "created"
    else:
        changes["tracing.ts"] = "already exists"

    # ── 3. Patch src/index.ts ──────────────────────────────────────────────
    original = index_path.read_text()
    patched = original

    # a) Import tracing first (before all other imports)
    if TRACING_IMPORT not in patched:
        first_import_pos = patched.find("import ")
        if first_import_pos != -1:
            patched = (
                patched[:first_import_pos]
                + TRACING_IMPORT
                + "\n"
                + patched[first_import_pos:]
            )
        changes["tracing import"] = "added"

    # b) Import prisma (if not already there)
    if PRISMA_IMPORT not in patched and "from './db/client" not in patched:
        # Insert after the tracing import line
        tracing_line_end = patched.find("\n", patched.find(TRACING_IMPORT)) + 1
        patched = (
            patched[:tracing_line_end]
            + PRISMA_IMPORT
            + "\n"
            + patched[tracing_line_end:]
        )
        changes["prisma import"] = "added"

    # c) Import logger
    if LOGGER_IMPORT not in patched:
        tracing_line_end = patched.find("\n", patched.find(TRACING_IMPORT)) + 1
        patched = (
            patched[:tracing_line_end]
            + LOGGER_IMPORT
            + "\n"
            + patched[tracing_line_end:]
        )
        changes["logger import"] = "added"

    # d) Import rate-limit
    if RATE_LIMIT_IMPORT not in patched:
        # Add after the last import block line
        last_import_end = 0
        for line in patched.split("\n"):
            if line.startswith("import "):
                last_import_end = patched.find(line) + len(line) + 1
        patched = (
            patched[:last_import_end]
            + RATE_LIMIT_IMPORT
            + "\n"
            + patched[last_import_end:]
        )
        changes["rate-limit import"] = "added"

    # e) Inject request logging middleware after app.use(express.json())
    if "logger.info" not in patched and "request logging" not in patched:
        marker = "app.use(express.json())"
        marker_pos = patched.find(marker)
        if marker_pos != -1:
            after_marker = patched.find("\n", marker_pos) + 1
            patched = (
                patched[:after_marker]
                + REQUEST_LOG_MIDDLEWARE
                + patched[after_marker:]
            )
            changes["request logging middleware"] = "added"

    # f) Inject rate-limit middleware
    if "rateLimit(" not in patched:
        # Insert after request logging block
        if "request logging" in patched:
            log_block_end = patched.find(
                "next()\n})\n", patched.find("request logging")
            )
            if log_block_end != -1:
                insert_at = log_block_end + len("next()\n})\n")
                patched = (
                    patched[:insert_at]
                    + "\n"
                    + RATE_LIMIT_MIDDLEWARE
                    + patched[insert_at:]
                )
        else:
            # Fallback: after express.json()
            marker = "app.use(express.json())"
            marker_pos = patched.find(marker)
            if marker_pos != -1:
                after_marker = patched.find("\n", marker_pos) + 1
                patched = (
                    patched[:after_marker]
                    + "\n"
                    + RATE_LIMIT_MIDDLEWARE
                    + patched[after_marker:]
                )
        changes["rate limiting middleware"] = "added"

    # g) Replace /health/ready stub with DB-checking version
    old_ready = """\
app.get('/health/ready', (_req, res) => {
  res.json({ status: 'ok' })
})"""
    if old_ready in patched and "prisma.$queryRaw" not in patched:
        patched = patched.replace(old_ready, HEALTH_READY_HANDLER)
        changes["/health/ready"] = "upgraded to DB ping"

    if patched != original:
        if not dry_run:
            index_path.write_text(patched)
        changes["index.ts"] = "patched"

    # ── 4. Patch package.json ──────────────────────────────────────────────
    pkg_path = service_dir / "package.json"
    pkg = json.loads(pkg_path.read_text())
    deps_changed = False

    for pkg_name, version in DEPS_TO_ADD.items():
        if pkg_name not in pkg.get("dependencies", {}):
            pkg.setdefault("dependencies", {})[pkg_name] = version
            deps_changed = True

    for pkg_name, version in DEV_DEPS_TO_ADD.items():
        if pkg_name not in pkg.get("devDependencies", {}):
            pkg.setdefault("devDependencies", {})[pkg_name] = version
            deps_changed = True

    if deps_changed:
        if not dry_run:
            pkg_path.write_text(json.dumps(pkg, indent=2) + "\n")
        changes["package.json"] = "deps added"

    return changes


# ── CLI entry point ──────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--service", help="Target one service directory name")
    parser.add_argument(
        "--dry-run", action="store_true", help="Print changes, do not write"
    )
    args = parser.parse_args()

    root = Path(__file__).parent.parent
    if args.service:
        services = [root / "services" / args.service]
    else:
        services = discover_node_services(root)

    if not services:
        print("No matching Node/Express services found.", file=sys.stderr)
        sys.exit(1)

    for svc in services:
        print(f"\n── {svc.name} {'(dry-run)' if args.dry_run else ''}")
        changes = inject_middleware(svc, dry_run=args.dry_run)
        for key, val in changes.items():
            print(f"   {key}: {val}")

    print("\nDone.")


if __name__ == "__main__":
    main()
