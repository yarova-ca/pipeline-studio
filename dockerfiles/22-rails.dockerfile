# ─────────────────────────────────────────────────────────────────────────
# Framework: 22 Ruby — Rails 8.0
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Ruby + Bundler)
# Runtime:   ruby:3.3-alpine
# FIPS:      registry.access.redhat.com/ubi9/ruby-32
# Port:      3000
# Rails: Puma is the default Rails app server
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends ruby ruby-dev build-essential \
 && rm -rf /var/lib/apt/lists/*
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
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]

# ── Runtime — FIPS (UBI9 ruby-32) ────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/ruby-32 AS runtime-fips
WORKDIR /app
RUN useradd -u 1001 -r -g 0 app
COPY --from=build --chown=app:app /app ./
USER app
EXPOSE 3000
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
