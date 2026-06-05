# ─────────────────────────────────────────────────────────────────────────
# Framework: 01 SSR/Hybrid — Next.js 16.2.6
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Node.js 22 installed)
# Runtime:   node:22-alpine (default) | node:22-slim | ubi9/nodejs-22-minimal
# RUNTIME build-arg: alpine (default) | slim | fips
# Port:      3000
# Next.js: run "next build" then "next start" or use custom server.js
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
ARG RUNTIME=alpine
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
RUN printf 'root:x:0:0:root:/root:/bin/sh\nnobody:x:65534:65534:nobody:/nonexistent:/bin/false\napp:x:1001:1001::/home/app:/sbin/nologin\n' > /tmp/app-passwd \
 && printf 'root:x:0:\nnobody:x:65534:\napp:x:1001:\n' > /tmp/app-group

# ── Runtime base images ───────────────────────────────────────────────────
# docker build --build-arg RUNTIME=alpine|slim|fips  (default: alpine)
FROM node:22-alpine AS base-alpine
FROM node:22-slim AS base-slim
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal AS base-fips

FROM base-${RUNTIME} AS runtime
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/.next ./.next
COPY --from=build --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=build --chown=1001:1001 /app/package.json ./
COPY --from=build --chown=1001:1001 /app/public ./public
USER 1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live',(r)=>r.statusCode===200?process.exit(0):process.exit(1))" || exit 1
LABEL org.opencontainers.image.source="https://github.com/yarova-ca/pipeline-studio" \
      org.opencontainers.image.vendor="Yarova Labs" \
      org.opencontainers.image.licenses="MIT"
CMD ["node_modules/.bin/next", "start"]

# ── FIPS named stage (backward compat — also use --build-arg RUNTIME=fips) ─
FROM base-fips AS runtime-fips
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/.next ./.next
COPY --from=build --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=build --chown=1001:1001 /app/package.json ./
COPY --from=build --chown=1001:1001 /app/public ./public
USER 1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live',(r)=>r.statusCode===200?process.exit(0):process.exit(1))" || exit 1
LABEL org.opencontainers.image.source="https://github.com/yarova-ca/pipeline-studio" \
      org.opencontainers.image.vendor="Yarova Labs" \
      org.opencontainers.image.licenses="MIT"
CMD ["node_modules/.bin/next", "start"]
