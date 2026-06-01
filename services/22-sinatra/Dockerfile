# ─────────────────────────────────────────────────────────────────────────
# Framework: 22 Ruby — Sinatra 4.0
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Ruby + Bundler)
# Runtime:   ruby:3.3-alpine
# FIPS:      registry.access.redhat.com/ubi9/ruby-32
# Port:      3000
# Sinatra: rackup with config.ru; REPLACE if using a different server
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
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
COPY Gemfile Gemfile.lock ./
RUN bundle config set without 'development test' \
 && bundle install --path vendor/bundle
COPY . .

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM ruby:3.3-alpine AS runtime
WORKDIR /app
RUN adduser -D -u 1001 app
COPY --from=build --chown=app:app /app ./
USER app
EXPOSE 3000
CMD ["bundle", "exec", "rackup", "--host", "0.0.0.0", "--port", "3000"]

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: ruby:3.3-slim — Debian slim, glibc (better native gem compat than Alpine musl)
#FROM ruby:3.3-slim AS runtime
#WORKDIR /app
#RUN useradd -u 1001 -r app
#COPY --from=build --chown=app:app /app ./
#USER app
#EXPOSE 3000
#CMD ["bundle", "exec", "rackup", "--host", "0.0.0.0", "--port", "3000"]

# Option: ruby:3.3 — full Debian bookworm (largest, most compat; use only if slim fails)
#FROM ruby:3.3 AS runtime
#WORKDIR /app
#RUN useradd -u 1001 -r app
#COPY --from=build --chown=app:app /app ./
#USER app
#EXPOSE 3000
#CMD ["bundle", "exec", "rackup", "--host", "0.0.0.0", "--port", "3000"]

# ── Runtime — FIPS (UBI9 ruby-32) ────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/ruby-32 AS runtime-fips
WORKDIR /app
RUN useradd -u 1001 -r -g 0 app
COPY --from=build --chown=app:app /app ./
USER app
EXPOSE 3000
CMD ["bundle", "exec", "rackup", "--host", "0.0.0.0", "--port", "3000"]
