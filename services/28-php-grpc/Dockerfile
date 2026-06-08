# syntax=docker/dockerfile:1.6
# ─────────────────────────────────────────────────────────────────────────
# Framework: 28 PHP — gRPC service
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (PHP 8.3 + Composer) | php:8.3-fpm images
# Runtime:   php:8.3-fpm-bookworm
# Port:      50051 (gRPC), 8080 (HTTP health)
# ─────────────────────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04

FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends \
    php8.3 php8.3-cli php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip \
    curl ca-certificates unzip git \
 && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
 && rm -rf /var/lib/apt/lists/*

FROM php:8.3-fpm-bookworm AS base-sdk
FROM php:8.3-fpm-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress --ignore-platform-reqs

FROM php:8.3-fpm-bookworm AS runtime
WORKDIR /app
COPY --from=build /app/vendor ./vendor
COPY server.php .
COPY src ./src
ENV GRPC_PORT=50051 HTTP_PORT=8080
EXPOSE 50051 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health/live || exit 1
LABEL org.opencontainers.image.source="https://github.com/yarova-ca/pipeline-studio" \
      org.opencontainers.image.vendor="Yarova Labs" \
      org.opencontainers.image.licenses="MIT"
CMD ["php", "server.php"]
