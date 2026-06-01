# ─────────────────────────────────────────────────────────────────────────
# Framework: 03 SSG — Hugo 0.161
# Pattern:   Multi-stage Docker (build → static → nginx)
# Build:     ubuntu:24.04
# Runtime:   nginx:alpine (default) | nginx:1.27-stable-alpine3.21-slim | ubi9/nginx-122
# Port:      80
# Hugo: hugo --minify outputs to public/
# RUNTIME build-arg: alpine (default) | stable | fips
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
ARG RUNTIME=alpine
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \
 && wget -q https://github.com/gohugoio/hugo/releases/download/v0.161.0/hugo_extended_0.161.0_linux-amd64.tar.gz \
 && tar -xzf hugo_extended_0.161.0_linux-amd64.tar.gz -C /usr/local/bin \
 && rm hugo_extended_0.161.0_linux-amd64.tar.gz \
 && rm -rf /var/lib/apt/lists/*

FROM node:22-bookworm-slim AS base-sdk
FROM node:22-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY . .
RUN hugo --minify

# ── Base image stages (no RUN — selection only) ───────────────────────────
FROM nginx:alpine AS base-alpine
FROM nginx:1.27-stable-alpine3.21-slim AS base-stable
FROM registry.access.redhat.com/ubi9/nginx-122 AS base-fips

# ── Runtime stage (ARG-selectable) ────────────────────────────────────────
FROM base-${RUNTIME} AS runtime
COPY --from=build /app/public /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM base-fips AS runtime-fips
COPY --from=build /app/public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
