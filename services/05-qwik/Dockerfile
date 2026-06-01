# ─────────────────────────────────────────────────────────────────────────
# Framework: 05 Resumability — Qwik 2.0
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Node.js 22 installed)
# Runtime:   node:22-alpine
# FIPS:      registry.access.redhat.com/ubi9/nodejs-22-minimal
# Port:      3000
# Qwik: adaptor-express; entry point is server/entry.express.js
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

FROM node:22-bookworm-slim AS base-sdk
FROM node:22-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live',(r)=>r.statusCode===200?process.exit(0):process.exit(1))" || exit 1

CMD ["node", "server/entry.express.js"]

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: node:22-slim — Debian-based, glibc (better native addon compatibility than Alpine musl)
#FROM node:22-slim AS runtime
#WORKDIR /app
#RUN addgroup --system app && adduser --system --ingroup app app
#COPY --from=build --chown=app:app /app/dist ./dist
#COPY --from=build --chown=app:app /app/node_modules ./node_modules
#COPY --from=build --chown=app:app /app/package.json ./
#USER app
#EXPOSE 3000
#CMD ["node", "server/entry.express.js"]

# Option: cgr.dev/chainguard/node:22 — hardened, minimal, sigstore-verified supply chain
#FROM cgr.dev/chainguard/node:22 AS runtime
#WORKDIR /app
#COPY --from=build --chown=65532:65532 /app/dist ./dist
#COPY --from=build --chown=65532:65532 /app/node_modules ./node_modules
#COPY --from=build --chown=65532:65532 /app/package.json ./
#EXPOSE 3000
#CMD ["node", "server/entry.express.js"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal AS runtime-fips
WORKDIR /app
RUN useradd -u 1001 -r -g 0 -s /sbin/nologin app
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./
USER 1001
EXPOSE 3000
CMD ["node", "server/entry.express.js"]
