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
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends curl unzip ca-certificates \
 && curl -fsSL https://bun.sh/install | BUN_INSTALL=/usr/local bash \
 && rm -rf /var/lib/apt/lists/*

FROM node:22-bookworm-slim AS base-sdk
FROM node:22-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
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

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: oven/bun:1-slim — Debian slim, glibc (better compat for native addons)
#FROM oven/bun:1-slim AS runtime
#WORKDIR /app
#RUN adduser -D -u 1001 app
#COPY --from=build --chown=app:app /app/dist ./dist
#COPY --from=build --chown=app:app /app/package.json ./
#USER app
#EXPOSE 3000
#CMD ["bun", "run", "dist/index.js"]

# Option: oven/bun:1 — full Debian image (largest; use if slim or alpine fails)
#FROM oven/bun:1 AS runtime
#WORKDIR /app
#RUN adduser -D -u 1001 app
#COPY --from=build --chown=app:app /app/dist ./dist
#COPY --from=build --chown=app:app /app/package.json ./
#USER app
#EXPOSE 3000
#CMD ["bun", "run", "dist/index.js"]
