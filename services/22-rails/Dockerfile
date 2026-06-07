# ─────────────────────────────────────────────────────────────────────────
# Framework: 22 Ruby — Rails 8.0
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Ruby + Bundler)
# Runtime:   ruby:3.3-alpine (default) | ruby:3.3-slim | ubi9/ruby-32
# Port:      3000
# Rails: Puma is the default Rails app server
# RUNTIME build-arg: alpine (default) | slim | fips
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
ARG RUNTIME=alpine
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
RUN printf 'root:x:0:0:root:/root:/bin/sh\nnobody:x:65534:65534:nobody:/nonexistent:/bin/false\napp:x:1001:1001::/home/app:/sbin/nologin\n' > /tmp/app-passwd \
 && printf 'root:x:0:\nnobody:x:65534:\napp:x:1001:\n' > /tmp/app-group

# ── Base image stages (no RUN — selection only) ───────────────────────────
FROM ruby:3.3-alpine AS base-alpine
FROM ruby:3.3-slim AS base-slim
FROM registry.access.redhat.com/ubi9/ruby-32 AS base-fips

# ── Runtime stage (ARG-selectable) ────────────────────────────────────────
FROM base-${RUNTIME} AS runtime
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app ./
USER 1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health/live || exit 1
LABEL org.opencontainers.image.source="https://github.com/yarova-ca/pipeline-studio" \
      org.opencontainers.image.vendor="Yarova Labs" \
      org.opencontainers.image.licenses="MIT"
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM base-fips AS runtime-fips
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app ./
USER 1001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health/live || exit 1
LABEL org.opencontainers.image.source="https://github.com/yarova-ca/pipeline-studio" \
      org.opencontainers.image.vendor="Yarova Labs" \
      org.opencontainers.image.licenses="MIT"
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
