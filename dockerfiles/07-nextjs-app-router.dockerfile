# ─────────────────────────────────────────────────────────────────────────
# Framework: 07 Streaming SSR — Next.js App Router 16
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Node.js 22 installed)
# Runtime:   node:22-alpine
# FIPS:      registry.access.redhat.com/ubi9/nodejs-22-minimal
# Port:      3000
# Next.js App Router: same as standard Next.js — node server.js
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*
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
CMD ["node", "server.js"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal AS runtime-fips
WORKDIR /app
RUN useradd -u 1001 -r -g 0 -s /sbin/nologin app
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./
USER 1001
EXPOSE 3000
CMD ["node", "server.js"]
