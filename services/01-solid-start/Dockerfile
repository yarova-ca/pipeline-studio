# syntax=docker/dockerfile:1.6
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

# ── build ────────────────────────────────────────────────────────────────────
FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── runtime (standard — default) ─────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/.output .output
ENV PORT=3000 NODE_ENV=production
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]

# ── runtime variants (uncomment one, comment the standard block above) ────────
# slim
# FROM gcr.io/distroless/nodejs22-debian12 AS runtime
# WORKDIR /app
# COPY --from=build /app/.output .output
# ENV PORT=3000 NODE_ENV=production
# EXPOSE 3000
# CMD [".output/server/index.mjs"]

# chainguard
# FROM cgr.dev/chainguard/node:latest AS runtime
# WORKDIR /app
# COPY --from=build /app/.output .output
# ENV PORT=3000 NODE_ENV=production
# EXPOSE 3000
# CMD [".output/server/index.mjs"]

# ubi9
# FROM registry.access.redhat.com/ubi9-minimal AS runtime
# RUN microdnf install -y nodejs && microdnf clean all
# WORKDIR /app
# COPY --from=build /app/.output .output
# ENV PORT=3000 NODE_ENV=production
# EXPOSE 3000
# CMD ["node", ".output/server/index.mjs"]

# edge (multi-arch)
# FROM --platform=$TARGETPLATFORM node:22-bookworm-slim AS runtime
# WORKDIR /app
# COPY --from=build /app/.output .output
# ENV PORT=3000 NODE_ENV=production
# EXPOSE 3000
# CMD ["node", ".output/server/index.mjs"]
