# ─────────────────────────────────────────────────────────────────────────
# Framework: 13 PWA — Vite PWA Plugin 0.21
# Pattern:   Multi-stage Docker (build → static → nginx)
# Build:     ubuntu:24.04
# Runtime:   nginx:alpine
# FIPS:      registry.access.redhat.com/ubi9/nginx-122
# Port:      80
# Vite PWA: Vite outputs to dist/; service worker included
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
RUN npm ci
COPY . .
RUN npm run build

# ── Runtime stage (standard — nginx serves static assets) ─────────────────
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:80/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: nginx:1.27-stable-alpine3.21-slim — pinned stable slim tag (more predictable than :alpine)
#FROM nginx:1.27-stable-alpine3.21-slim AS runtime
#COPY --from=build /app/dist /usr/share/nginx/html
#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]

# Option: cgr.dev/chainguard/nginx:latest — hardened nginx, sigstore-verified, rootless by default
#FROM cgr.dev/chainguard/nginx:latest AS runtime
#COPY --from=build /app/dist /usr/share/nginx/html
#EXPOSE 80

# Option: caddy:2-alpine — replaces nginx entirely; HTTPS auto-provisioning, simpler config
#FROM caddy:2-alpine AS runtime
#COPY --from=build /app/dist /srv
#COPY Caddyfile /etc/caddy/Caddyfile
#EXPOSE 80 443
#CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/nginx-122 AS runtime-fips
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:80/ > /dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
