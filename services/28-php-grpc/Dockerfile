# syntax=docker/dockerfile:1.6
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04

FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends php8.3 php8.3-cli php8.3-mbstring php8.3-xml php8.3-fpm curl \
 && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
 && rm -rf /var/lib/apt/lists/*

FROM php:8.3-fpm-bookworm AS base-sdk
FROM php:8.3-fpm-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
RUN apt-get update && apt-get install -y --no-install-recommends zlib1g-dev libgrpc-dev && rm -rf /var/lib/apt/lists/*
COPY composer.json composer.lock* ./
RUN curl -sS https://getcomposer.org/installer | php && php composer.phar install --no-dev

FROM php:8.3-fpm-slim-bookworm AS runtime
WORKDIR /app
COPY --from=build /app/vendor ./vendor
COPY server.php .
ENV GRPC_PORT=50051 HTTP_PORT=8080
EXPOSE 50051 8080
CMD ["php", "server.php"]
