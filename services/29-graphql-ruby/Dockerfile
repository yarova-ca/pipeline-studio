# syntax=docker/dockerfile:1.6
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04

FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends ruby ruby-dev build-essential \
 && rm -rf /var/lib/apt/lists/*

FROM ruby:3.3-bookworm AS base-sdk
FROM ruby:3.3-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY Gemfile Gemfile.lock* ./
RUN bundle install

FROM ruby:3.3-slim-bookworm AS runtime
WORKDIR /app
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY . .
ENV PORT=4567 RACK_ENV=production
EXPOSE 4567
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4567/health/live || exit 1

CMD ["bundle", "exec", "puma", "-b", "tcp://0.0.0.0:4567"]
