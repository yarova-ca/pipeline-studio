# syntax=docker/dockerfile:1.6
# Build: Ruby 3.3 (native gem toolchain). Runtime: ruby:3.4-slim, non-root.
FROM ruby:3.4 AS build
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle config set --local without 'development test' \
 && bundle config set --local path 'vendor/bundle' \
 && bundle install --jobs 4
COPY . .

FROM ruby:3.4-slim AS runtime
WORKDIR /app
# libpq5 is the runtime shared library the pg gem links against.
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
 && rm -rf /var/lib/apt/lists/* \
 && useradd -r -u 1001 appuser
COPY --from=build --chown=1001:1001 /app /app
# Rails writes to tmp/ and log/ at runtime; the app dir must be owned by the
# non-root user, including the WORKDIR itself (created as root above).
RUN mkdir -p /app/tmp/pids /app/tmp/cache /app/log /app/storage \
 && chown -R 1001:1001 /app
ENV RAILS_ENV=production \
    PORT=3000 \
    BUNDLE_WITHOUT="development:test" \
    BUNDLE_PATH="vendor/bundle" \
    RAILS_LOG_TO_STDOUT=1
EXPOSE 3000
USER 1001
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD ruby -e "require 'net/http'; exit(Net::HTTP.get_response(URI('http://localhost:3000/health/live')).code == '200' ? 0 : 1)" || exit 1
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
