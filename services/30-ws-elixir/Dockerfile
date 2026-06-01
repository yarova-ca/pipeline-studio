# syntax=docker/dockerfile:1.6
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04

FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends erlang elixir \
 && rm -rf /var/lib/apt/lists/*

FROM hexpm/elixir:1.17-erlang-27.3.4.12-debian-bookworm-20260518-slim AS base-sdk
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY mix.exs mix.lock* ./
RUN mix local.hex --force && mix local.rebar --force
RUN mix deps.get
COPY lib ./lib
ENV MIX_ENV=prod
RUN mix release

FROM debian:bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl libncurses6 && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/_build/prod/rel/ws_elixir .
ENV PORT=8080
EXPOSE 8080
CMD ["bin/ws_elixir", "start"]
