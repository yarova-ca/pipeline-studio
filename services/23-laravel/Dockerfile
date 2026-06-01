# ─────────────────────────────────────────────────────────────────────────
# Framework: 23 PHP — Laravel 12
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (PHP 8.3 + Composer)
# Runtime:   php:8.3-fpm-alpine (default) | php:8.3-fpm
# Port:      9000 (php-fpm — pair with an nginx sidecar for HTTP port 80/443)
# Laravel: php-fpm serves on port 9000; pair with nginx sidecar for HTTP
# RUNTIME build-arg: alpine (default) | debian
# Note: No FIPS variant for PHP. Uses www-data user (built into php images).
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
ARG RUNTIME=alpine
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends php8.3 php8.3-cli php8.3-mbstring php8.3-xml \
 && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
 && rm -rf /var/lib/apt/lists/*

FROM php:8.3-cli-bookworm AS base-sdk
FROM php:8.3-cli-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress
COPY . .

# ── Base image stages (no RUN — selection only) ───────────────────────────
FROM php:8.3-fpm-alpine AS base-alpine
FROM php:8.3-fpm AS base-debian

# ── Runtime stage (ARG-selectable) ────────────────────────────────────────
FROM base-${RUNTIME} AS runtime
WORKDIR /app
RUN apk add --no-cache php83-pdo php83-pdo_mysql php83-opcache 2>/dev/null || docker-php-ext-install pdo pdo_mysql opcache 2>/dev/null || true
COPY --from=build --chown=www-data:www-data /app ./
USER www-data
EXPOSE 9000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:9000/health/live || exit 1

CMD ["php-fpm", "-F"]
