# ─────────────────────────────────────────────────────────────────────────
# Framework: 14 Node/Deno/Bun — Deno 2.3
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Deno 2.3 installed)
# Runtime:   denoland/deno:2.3-alpine
# FIPS:      N/A — no dedicated FIPS variant for Deno
# Port:      8000
# Deno server: deno task start defined in deno.json
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends curl unzip ca-certificates \
 && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh \
 && rm -rf /var/lib/apt/lists/*

FROM node:22-bookworm-slim AS base-sdk
FROM node:22-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY deno.json deno.lock* ./
RUN deno cache src/main.ts
COPY . .
RUN deno task build 2>/dev/null || echo "No build step — running directly"

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM denoland/deno:2.3-alpine AS runtime
WORKDIR /app
USER 1001
COPY --from=build --chown=1001:0 /app ./
EXPOSE 8000
# Deno permissions: add --allow-net --allow-read etc. as needed
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["deno", "task", "start"]

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: denoland/deno:2.3 — Debian-based, larger, more compat (glibc vs musl)
#FROM denoland/deno:2.3 AS runtime
#WORKDIR /app
#USER 1001
#COPY --from=build --chown=1001:0 /app ./
#EXPOSE 8000
#CMD ["deno", "task", "start"]

# Option: denoland/deno:2.3-distroless — minimal, no shell, sigstore-verified
#FROM denoland/deno:2.3-distroless AS runtime
#WORKDIR /app
#COPY --from=build --chown=65532:65532 /app ./
#EXPOSE 8000
#CMD ["deno", "task", "start"]
