# syntax=docker/dockerfile:1.6
# Build: Elixir 1.17 + Erlang 27 → mix release. Runtime: debian-slim, non-root.
FROM hexpm/elixir:1.17.3-erlang-27.1.2-debian-bookworm-20260610-slim AS build
WORKDIR /app
ENV MIX_ENV=prod
RUN mix local.hex --force && mix local.rebar --force
COPY mix.exs mix.lock ./
RUN mix deps.get --only prod
COPY config ./config
COPY lib ./lib
COPY priv ./priv
COPY compliance ./compliance
RUN mix deps.compile && mix compile && mix release

FROM debian:bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
      libstdc++6 openssl libncurses6 ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && useradd -r -u 1001 appuser
COPY --from=build --chown=1001:1001 /app/_build/prod/rel/app ./
COPY --from=build --chown=1001:1001 /app/compliance ./compliance
ENV PORT=4000
EXPOSE 4000
USER 1001
CMD ["bin/app", "start"]
