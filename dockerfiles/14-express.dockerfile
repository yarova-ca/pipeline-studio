# ─────────────────────────────────────────────────────────────────────────
# Framework: 14 Node/Deno/Bun — Express 5.0
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Node.js 22 installed)
# Runtime:   node:22-alpine
# FIPS:      registry.access.redhat.com/ubi9/nodejs-22-minimal
# Port:      3000
# Express: entry point after tsc build; adjust if using plain JS (node src/index.js)
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
CMD ["node", "dist/index.js"]

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
#CMD ["node", "dist/index.js"]

# Option: cgr.dev/chainguard/node:22 — hardened, minimal, sigstore-verified supply chain
#FROM cgr.dev/chainguard/node:22 AS runtime
#WORKDIR /app
#COPY --from=build --chown=65532:65532 /app/dist ./dist
#COPY --from=build --chown=65532:65532 /app/node_modules ./node_modules
#COPY --from=build --chown=65532:65532 /app/package.json ./
#EXPOSE 3000
#CMD ["node", "dist/index.js"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal AS runtime-fips
WORKDIR /app
RUN useradd -u 1001 -r -g 0 -s /sbin/nologin app
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/package.json ./
USER 1001
EXPOSE 3000
CMD ["node", "dist/index.js"]
