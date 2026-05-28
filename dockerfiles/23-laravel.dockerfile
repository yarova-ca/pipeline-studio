# ─────────────────────────────────────────────────────────────────────────
# Framework: 23 PHP — Laravel 12
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (PHP 8.3 + Composer)
# Runtime:   php:8.3-fpm-alpine (php-fpm on port 9000)
# FIPS:      N/A — no dedicated FIPS variant for PHP; use Alpine FIPS kernel
# Port:      9000 (php-fpm — pair with an nginx sidecar for HTTP port 80/443)
# Laravel: php-fpm serves on port 9000; pair with nginx sidecar for HTTP
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends php8.3 php8.3-cli php8.3-mbstring php8.3-xml \
 && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress
COPY . .

# ── Runtime stage (standard — php-fpm-alpine) ─────────────────────────────
FROM php:8.3-fpm-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache php83-pdo php83-pdo_mysql php83-opcache
COPY --from=build --chown=www-data:www-data /app ./
USER www-data
EXPOSE 9000
CMD ["php-fpm", "-F"]

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: php:8.3-fpm — Debian bullseye slim (larger, more compat, easier ext install)
#FROM php:8.3-fpm AS runtime
#WORKDIR /app
#RUN docker-php-ext-install pdo pdo_mysql opcache
#COPY --from=build --chown=www-data:www-data /app ./
#USER www-data
#EXPOSE 9000
#CMD ["php-fpm", "-F"]

# Option: php:8.3-cli-alpine — for CLI workers / queue consumers (not http serving)
#FROM php:8.3-cli-alpine AS runtime
#WORKDIR /app
#COPY --from=build --chown=www-data:www-data /app ./
#USER www-data
#CMD ["php", "artisan", "queue:work"]
