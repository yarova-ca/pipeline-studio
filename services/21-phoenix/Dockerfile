# ─────────────────────────────────────────────────────────────────────────
# Framework: 21 Elixir/BEAM — Phoenix 1.7
# Pattern:   Multi-stage Docker (mix release)
# Build:     ubuntu:24.04 (Erlang + Elixir)
# Runtime:   hexpm/elixir:1.17-erlang-27.3.4.12-debian-bookworm-20260518-slim (default) | hexpm/elixir:1.17-erlang-27.3.4.12-alpine-3.21.7 | ubi9/ubi-minimal
# Port:      4000
# Phoenix: mix release; REPLACE myapp with your OTP app name
# RUNTIME build-arg: debian (default) | alpine | fips
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
ARG RUNTIME=debian
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends erlang elixir \
 && rm -rf /var/lib/apt/lists/*

FROM hexpm/elixir:1.17-erlang-27.3.4.12-debian-bookworm-20260518-slim AS base-sdk
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
ENV MIX_ENV=prod
COPY mix.exs mix.lock ./
RUN mix local.hex --force && mix local.rebar --force && mix deps.get --only prod
COPY config ./config
COPY lib ./lib
COPY priv ./priv
RUN mix compile && mix release
# REPLACE: 'myapp' in CMD below with your OTP app name (from mix.exs :app key)
RUN printf 'root:x:0:0:root:/root:/bin/sh\nnobody:x:65534:65534:nobody:/nonexistent:/bin/false\napp:x:1001:1001::/home/app:/sbin/nologin\n' > /tmp/app-passwd \
 && printf 'root:x:0:\nnobody:x:65534:\napp:x:1001:\n' > /tmp/app-group

# ── Base image stages (no RUN — selection only) ───────────────────────────
FROM hexpm/elixir:1.17-erlang-27.3.4.12-debian-bookworm-20260518-slim AS base-debian
FROM hexpm/elixir:1.17-erlang-27.3.4.12-alpine-3.21.7 AS base-alpine
FROM registry.access.redhat.com/ubi9/ubi-minimal AS base-fips

# ── Runtime stage (ARG-selectable) ────────────────────────────────────────
FROM base-${RUNTIME} AS runtime
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/_build/prod/rel/myapp ./
# REPLACE: myapp with your OTP release name
USER 1001
EXPOSE 4000
# REPLACE: myapp with your OTP release name (from mix.exs :app key)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health/live || exit 1
LABEL org.opencontainers.image.source="https://github.com/yarova-ca/pipeline-studio" \
      org.opencontainers.image.vendor="Yarova Labs" \
      org.opencontainers.image.licenses="MIT"
CMD ["bin/app", "start"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM base-fips AS runtime-fips
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/_build/prod/rel/myapp ./
# REPLACE: myapp with your OTP release name
USER 1001
EXPOSE 4000
# REPLACE: myapp with your OTP release name
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health/live || exit 1
LABEL org.opencontainers.image.source="https://github.com/yarova-ca/pipeline-studio" \
      org.opencontainers.image.vendor="Yarova Labs" \
      org.opencontainers.image.licenses="MIT"
CMD ["bin/app", "start"]
