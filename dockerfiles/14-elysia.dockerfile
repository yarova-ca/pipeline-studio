# ─────────────────────────────────────────────────────────────────────────
# Framework: 14 Node/Deno/Bun — Elysia 1.2
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Bun 1.x installed)
# Runtime:   oven/bun:1-alpine
# FIPS:      N/A — no dedicated FIPS variant for Bun
# Port:      3000
# Elysia (Bun): bun build outputs to dist/index.js
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends curl unzip ca-certificates \
 && curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY bun.lockb package.json ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun build src/index.ts --target bun --outfile dist/index.js

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM oven/bun:1-alpine AS runtime
WORKDIR /app
RUN adduser -D -u 1001 app
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/package.json ./
USER app
EXPOSE 3000
CMD ["bun", "run", "dist/index.js"]
