# ─────────────────────────────────────────────────────────────────────────
# Framework: 14 Node/Deno/Bun — Express 5.0
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Node.js 22 installed)
# Runtime:   node:22-alpine (default) | node:22-slim | ubi9/nodejs-22-minimal
# RUNTIME build-arg: alpine (default) | slim | fips
# Port:      3000
# Express: entry point after tsc build; adjust if using plain JS (node src/index.js)
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
ARG RUNTIME=alpine
FROM ubuntu:26.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

FROM node:22-bookworm-slim AS base-sdk
FROM node:22-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
ARG PKG_MGR=npm
COPY package.json ./
COPY package-lock.json* pnpm-lock.yaml* yarn.lock* bun.lockb* ./
ARG PKG_MGR
RUN set -eux; \
  case "${PKG_MGR}" in \
    npm)  npm ci ;; \
    pnpm) corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile ;; \
    yarn) corepack enable && corepack prepare yarn@stable --activate && yarn install --immutable ;; \
    bun)  npm i -g bun@latest && bun install --frozen-lockfile ;; \
    *)    echo "Unknown PKG_MGR: ${PKG_MGR}" && exit 1 ;; \
  esac
COPY . .
ARG COMPLIANCE=standard
COPY src/compliance/${COMPLIANCE}/ ./src/compliance/active/
ARG OBSERVABILITY=none
COPY src/observability/${OBSERVABILITY}/ ./src/observability/active/
ARG AUTH=all
COPY src/auth/${AUTH}/ ./src/auth/active/
ARG ORM=prisma
COPY src/db/${ORM}/ ./src/db/active/
RUN if [ "${ORM}" = "prisma" ]; then npx prisma generate; fi
RUN if [ "${COMPLIANCE}" = "fips" ] && [ "${RUNTIME}" != "fips" ]; then echo "ERROR: COMPLIANCE=fips requires RUNTIME=fips"; exit 1; fi
ARG BUILD_TOOL=tsc
ENV BUILD_TOOL=${BUILD_TOOL}
RUN npm run build
RUN case "${PKG_MGR}" in \
      npm)  npm prune --omit=dev ;; \
      pnpm) pnpm prune --prod ;; \
      yarn) yarn workspaces focus --production || true ;; \
      bun)  rm -rf node_modules && bun install --production --frozen-lockfile ;; \
    esac
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
COPY --from=build --chown=1001:1001 /app/dist ./dist
COPY --from=build --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=build --chown=1001:1001 /app/package.json ./
USER 1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live',(r)=>r.statusCode===200?process.exit(0):process.exit(1))" || exit 1
LABEL org.opencontainers.image.source="https://github.com/yarova-ca/pipeline-studio" \
      org.opencontainers.image.vendor="Yarova Labs" \
      org.opencontainers.image.licenses="MIT"
CMD ["node", "dist/index.js"]

# ── FIPS named stage (backward compat — also use --build-arg RUNTIME=fips) ─
FROM base-fips AS runtime-fips
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/dist ./dist
COPY --from=build --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=build --chown=1001:1001 /app/package.json ./
USER 1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health/live',(r)=>r.statusCode===200?process.exit(0):process.exit(1))" || exit 1
LABEL org.opencontainers.image.source="https://github.com/yarova-ca/pipeline-studio" \
      org.opencontainers.image.vendor="Yarova Labs" \
      org.opencontainers.image.licenses="MIT"
CMD ["node", "dist/index.js"]
