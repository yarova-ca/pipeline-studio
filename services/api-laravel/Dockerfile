# syntax=docker/dockerfile:1.6
# Vendor: composer. Runtime: php 8.3-cli with pgsql + apcu, non-root.
FROM composer:2.7 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --ignore-platform-reqs --prefer-dist --no-interaction

FROM php:8.3-cli AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev libonig-dev \
 && docker-php-ext-install pdo pdo_pgsql mbstring bcmath \
 && pecl install apcu && docker-php-ext-enable apcu \
 && printf "apc.enable_cli=1\n" > /usr/local/etc/php/conf.d/zz-apcu.ini \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=vendor /app/vendor ./vendor
COPY . .
RUN useradd -r -u 1001 appuser \
 && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
 && chown -R appuser:appuser /app
ENV APP_ENV=production \
    APP_DEBUG=false \
    CACHE_STORE=file \
    DB_CONNECTION=pgsql \
    LOG_CHANNEL=stderr \
    PORT=8080
EXPOSE 8080
USER appuser
# I-1: a JWT secret shorter than 32 chars stops the container before it serves.
# APP_KEY is generated at start if not supplied, so the framework can boot.
ENTRYPOINT ["sh","-c","[ ${#JWT_SECRET} -ge 32 ] || { echo 'FATAL: JWT_SECRET must be set and at least 32 characters' >&2; exit 1; }; export APP_KEY=${APP_KEY:-$(php artisan key:generate --show)}; php artisan l5-swagger:generate >/dev/null 2>&1 || true; exec php artisan serve --host=0.0.0.0 --port=${PORT}"]
