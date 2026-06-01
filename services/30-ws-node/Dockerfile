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

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
ENV PORT=8080 NODE_ENV=production
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health/live',(r)=>r.statusCode===200?process.exit(0):process.exit(1))" || exit 1

CMD ["node", "dist/index.js"]

# slim
# FROM gcr.io/distroless/nodejs22-debian12 AS runtime
# WORKDIR /app
# COPY --from=build /app/dist ./dist
# COPY --from=build /app/node_modules ./node_modules
# ENV PORT=8080 NODE_ENV=production
# EXPOSE 8080
# CMD ["dist/index.js"]
