# ─────────────────────────────────────────────────────────────────────────
# Framework: 21 Elixir/BEAM — Phoenix 1.7
# Pattern:   Multi-stage Docker (mix release)
# Build:     ubuntu:24.04 (Erlang + Elixir)
# Runtime:   hexpm/elixir:1.17-erlang-27-debian-bookworm-slim
# FIPS:      registry.access.redhat.com/ubi9/ubi-minimal
# Port:      4000
# Phoenix: mix release; REPLACE myapp with your OTP app name
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends erlang elixir \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV MIX_ENV=prod
COPY mix.exs mix.lock ./
RUN mix local.hex --force && mix local.rebar --force && mix deps.get --only prod
COPY config ./config
COPY lib ./lib
COPY priv ./priv
RUN mix compile && mix release
# REPLACE: 'myapp' in CMD below with your OTP app name (from mix.exs :app key)

# ── Runtime stage (standard) ──────────────────────────────────────────────
FROM hexpm/elixir:1.17-erlang-27-debian-bookworm-slim AS runtime
WORKDIR /app
RUN useradd -u 1001 -r -g 0 app
COPY --from=build --chown=1001:0 /app/_build/prod/rel/myapp ./
# REPLACE: myapp with your OTP release name
USER app
EXPOSE 4000
# REPLACE: myapp with your OTP release name (from mix.exs :app key)
CMD ["bin/myapp", "start"]

# ── Runtime — FIPS (UBI9 minimal) ────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/ubi-minimal AS runtime-fips
WORKDIR /app
RUN useradd -u 1001 -r -g 0 app
COPY --from=build --chown=1001:0 /app/_build/prod/rel/myapp ./
# REPLACE: myapp with your OTP release name
USER app
EXPOSE 4000
# REPLACE: myapp with your OTP release name
CMD ["bin/myapp", "start"]
