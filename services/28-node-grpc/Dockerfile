# syntax=docker/dockerfile:1.6
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
ARG RUNTIME=slim

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
RUN printf 'root:x:0:0:root:/root:/bin/sh\nnobody:x:65534:65534:nobody:/nonexistent:/bin/false\napp:x:1001:1001::/home/app:/sbin/nologin\n' > /tmp/app-passwd \
 && printf 'root:x:0:\nnobody:x:65534:\napp:x:1001:\n' > /tmp/app-group

FROM node:22-bookworm-slim AS base-slim
FROM node:22-alpine AS base-alpine
FROM registry.access.redhat.com/ubi9/nodejs-22-minimal AS base-fips

FROM base-${RUNTIME} AS runtime
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/dist ./dist
COPY --from=build --chown=1001:1001 /app/proto ./proto
COPY --from=build --chown=1001:1001 /app/node_modules ./node_modules
ENV GRPC_PORT=50051 HTTP_PORT=8080 NODE_ENV=production
USER 1001
EXPOSE 50051 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:50051/health/live',(r)=>r.statusCode===200?process.exit(0):process.exit(1))" || exit 1

CMD ["node", "dist/index.js"]

FROM base-fips AS runtime-fips
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/dist ./dist
COPY --from=build --chown=1001:1001 /app/proto ./proto
COPY --from=build --chown=1001:1001 /app/node_modules ./node_modules
ENV GRPC_PORT=50051 HTTP_PORT=8080 NODE_ENV=production
USER 1001
EXPOSE 50051 8080
CMD ["node", "dist/index.js"]
