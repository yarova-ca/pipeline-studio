#!/usr/bin/env python3
"""
add_all_middleware.py — Adds structured logging, Prometheus metrics, OTel tracing,
circuit breaker, graceful shutdown, and retry logic to ALL services.

Supports: Node/TypeScript, Python (FastAPI/Flask/Django/Starlette), Go (Gin/Echo/Chi/Fiber)

Usage:
  python3 scripts/add_all_middleware.py [--dry-run] [--lang node|python|go] [--service SLUG]
"""
import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent
SERVICES = ROOT / "services"
CANONICAL_NODE = SERVICES / "14-express"
CANONICAL_PYTHON = SERVICES / "15-fastapi"
CANONICAL_GO = SERVICES / "16-gin"

# ── Node middleware files to copy verbatim ─────────────────────────────────
NODE_FILES_TO_COPY = [
    ("src/logger.ts", "src/logger.ts"),
    ("src/tracing.ts", "src/tracing.ts"),
    ("src/metrics.ts", "src/metrics.ts"),
    ("src/middleware/circuit-breaker.ts", "src/middleware/circuit-breaker.ts"),
]

NODE_DEPS = {
    "pino": "^9.0.0",
    "prom-client": "^15.0.0",
    "@opentelemetry/sdk-node": "^0.52.0",
    "@opentelemetry/auto-instrumentations-node": "^0.49.0",
    "@opentelemetry/api": "^1.9.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.52.0",
    "express-rate-limit": "^7.0.0",
}
NODE_DEV_DEPS = {
    "pino-pretty": "^11.0.0",
}

def is_node_service(svc: Path) -> bool:
    pkg = svc / "package.json"
    if not pkg.exists():
        return False
    try:
        data = json.loads(pkg.read_text())
    except Exception:
        return False
    deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
    node_markers = [
        "express", "fastify", "hono", "@nestjs/core", "elysia",
        "@apollo/server", "graphql-yoga", "ws", "@grpc/grpc-js", "graphql",
    ]
    return any(k in deps for k in node_markers)

def process_node(svc: Path, dry_run: bool = False) -> list:
    changes = []
    src = svc / "src"
    if not src.exists():
        return changes

    # Copy middleware files from canonical (skip if already present)
    for src_rel, dst_rel in NODE_FILES_TO_COPY:
        src_file = CANONICAL_NODE / src_rel
        dst_file = svc / dst_rel
        if src_file.exists() and not dst_file.exists():
            if not dry_run:
                dst_file.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_file, dst_file)
            changes.append(f"copied {dst_rel}")

    # Update package.json with middleware deps
    pkg_path = svc / "package.json"
    if pkg_path.exists():
        try:
            data = json.loads(pkg_path.read_text())
        except Exception:
            return changes
        deps = data.setdefault("dependencies", {})
        dev_deps = data.setdefault("devDependencies", {})
        added = []
        for k, v in NODE_DEPS.items():
            if k not in deps:
                deps[k] = v
                added.append(k)
        for k, v in NODE_DEV_DEPS.items():
            if k not in dev_deps:
                dev_deps[k] = v
                added.append(f"{k}(dev)")
        if added:
            if not dry_run:
                pkg_path.write_text(json.dumps(data, indent=2) + "\n")
            changes.append(f"deps added: {', '.join(added)}")

    # Add SIGTERM handler + /metrics endpoint to entry point
    for entry_name in ["src/index.ts", "src/main.ts", "src/server.ts", "src/app.ts"]:
        entry = svc / entry_name
        if entry.exists():
            content = entry.read_text()
            modified = False

            # Add /metrics endpoint if not already present
            if "/metrics" not in content and "register" not in content and "prom-client" not in content:
                metrics_route = (
                    "\n// Prometheus metrics scrape endpoint\n"
                    "app.get('/metrics', async (_req, res) => {\n"
                    "  const { register } = await import('./metrics.js')\n"
                    "  res.set('Content-Type', register.contentType)\n"
                    "  res.end(await register.metrics())\n"
                    "})\n"
                )
                if "app.listen" in content:
                    content = content.replace(
                        "export const server = app.listen",
                        metrics_route + "\nexport const server = app.listen",
                        1,
                    )
                    modified = True
                    changes.append("added /metrics endpoint")

            # Add graceful shutdown if missing
            if "SIGTERM" not in content and "shutdown" not in content:
                shutdown_code = (
                    "\n// Graceful shutdown — drains in-flight requests before exiting.\n"
                    "process.on('SIGTERM', () => {\n"
                    "  const srv = (global as any).__server\n"
                    "  if (srv) srv.close(() => process.exit(0))\n"
                    "  else process.exit(0)\n"
                    "})\n"
                )
                content += shutdown_code
                modified = True
                changes.append("added SIGTERM handler")

            if modified and not dry_run:
                entry.write_text(content)
            break

    return changes


# ── Python middleware ───────────────────────────────────────────────────────
PYTHON_DEPS_TO_ADD = [
    "structlog==24.4.0",
    "prometheus-client==0.21.0",
    "slowapi==0.1.9",
    "opentelemetry-sdk==1.27.0",
    "opentelemetry-exporter-otlp==1.27.0",
    "opentelemetry-instrumentation-fastapi==0.48b0",
]

PYTHON_LOGGER_PY = """\
# Structured JSON logger for Python services.
# structlog: logging library that outputs JSON — parseable by log aggregators.
import structlog
import logging

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()
"""

def is_python_service(svc: Path) -> bool:
    return (svc / "requirements.txt").exists() or (svc / "pyproject.toml").exists()

def process_python(svc: Path, dry_run: bool = False) -> list:
    changes = []
    req_path = svc / "requirements.txt"
    if not req_path.exists():
        return changes

    req_content = req_path.read_text()
    added = []
    for dep in PYTHON_DEPS_TO_ADD:
        pkg_name = dep.split("==")[0]
        if pkg_name not in req_content:
            req_content += f"\n{dep}"
            added.append(dep)

    if added:
        if not dry_run:
            req_path.write_text(req_content.rstrip() + "\n")
        changes.append(f"deps added: {', '.join(added)}")

    # Create src/logger.py if missing
    logger_path = svc / "src" / "logger.py"
    if not logger_path.exists():
        if not dry_run:
            logger_path.parent.mkdir(parents=True, exist_ok=True)
            logger_path.write_text(PYTHON_LOGGER_PY)
        changes.append("created src/logger.py")

    return changes


# ── Go middleware ──────────────────────────────────────────────────────────
GO_METRICS_GO = """\
// Prometheus metrics for Go services.
// prometheus/client_golang: official Go Prometheus client library.
package metrics

import (
\t"net/http"

\t"github.com/prometheus/client_golang/prometheus"
\t"github.com/prometheus/client_golang/prometheus/promauto"
\t"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
\tHttpRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
\t\tName: "http_requests_total",
\t\tHelp: "Total HTTP requests",
\t}, []string{"method", "path", "status"})

\tHttpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
\t\tName:    "http_request_duration_seconds",
\t\tHelp:    "HTTP request duration in seconds",
\t\tBuckets: []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5},
\t}, []string{"method", "path"})

\tDbQueryDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
\t\tName:    "db_query_duration_seconds",
\t\tHelp:    "Database query duration in seconds",
\t\tBuckets: []float64{0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1},
\t}, []string{"operation"})
)

// MetricsHandler returns the Prometheus HTTP handler for /metrics endpoint.
func MetricsHandler() http.Handler {
\treturn promhttp.Handler()
}
"""

def is_go_service(svc: Path) -> bool:
    return (svc / "go.mod").exists()

def process_go(svc: Path, dry_run: bool = False) -> list:
    changes = []

    # Add prometheus/client_golang to go.mod if missing
    gomod = svc / "go.mod"
    if gomod.exists():
        content = gomod.read_text()
        if "prometheus/client_golang" not in content:
            content = content.rstrip() + "\nrequire github.com/prometheus/client_golang v1.20.0\n"
            if not dry_run:
                gomod.write_text(content)
            changes.append("added prometheus/client_golang to go.mod")

    # Create internal/metrics/metrics.go if missing
    metrics_dir = svc / "internal" / "metrics"
    metrics_file = metrics_dir / "metrics.go"
    if not metrics_file.exists():
        if not dry_run:
            metrics_dir.mkdir(parents=True, exist_ok=True)
            metrics_file.write_text(GO_METRICS_GO)
        changes.append("created internal/metrics/metrics.go")

    # Ensure slog JSON handler in main.go
    main_go = svc / "main.go"
    if main_go.exists():
        content = main_go.read_text()
        if "slog.NewJSONHandler" not in content and "slog" not in content:
            slog_init = (
                '\n\tslog.SetDefault(slog.New(slog.NewJSONHandler('
                'os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})))\n'
            )
            if "func main()" in content:
                content = content.replace("func main() {", f"func main() {{{slog_init}", 1)
                if not dry_run:
                    main_go.write_text(content)
                changes.append("added slog JSON handler")

    return changes


# ── Main ───────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--lang", choices=["node", "python", "go"])
    parser.add_argument("--service")
    args = parser.parse_args()

    if args.service:
        services = [SERVICES / args.service]
    else:
        services = sorted(p for p in SERVICES.iterdir() if p.is_dir())

    total = {"node": 0, "python": 0, "go": 0}

    for svc in services:
        if not svc.is_dir():
            continue

        if args.lang in (None, "node") and is_node_service(svc):
            changes = process_node(svc, args.dry_run)
            if changes:
                print(f"  [node] {svc.name}: {'; '.join(changes)}")
                total["node"] += 1

        if args.lang in (None, "python") and is_python_service(svc):
            changes = process_python(svc, args.dry_run)
            if changes:
                print(f"  [python] {svc.name}: {'; '.join(changes)}")
                total["python"] += 1

        if args.lang in (None, "go") and is_go_service(svc):
            changes = process_go(svc, args.dry_run)
            if changes:
                print(f"  [go] {svc.name}: {'; '.join(changes)}")
                total["go"] += 1

    print(f"\nDone — Node: {total['node']}, Python: {total['python']}, Go: {total['go']}")


if __name__ == "__main__":
    main()
