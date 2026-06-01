# ─────────────────────────────────────────────────────────────────────────
# Framework: 27 C/C++ — Crow 1.3.2
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (CMake + Clang + dependencies)
# Runtime:   debian:12-slim (debian slim — shared libs required)
# FIPS:      registry.access.redhat.com/ubi9/ubi-micro
# Port:      8080
# Crow: header-only library; cmake --build produces single binary
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends cmake clang libssl-dev zlib1g-dev \
    libjsoncpp-dev uuid-dev libpq-dev libbrotli-dev \
 && rm -rf /var/lib/apt/lists/*

FROM debian:bookworm AS base-sdk
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY CMakeLists.txt ./
COPY src ./src
COPY include ./include
RUN cmake -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_COMPILER=clang++ \
 && cmake --build build --parallel $(nproc)
# REPLACE: binary name 'app' below with your CMake target name

# ── Runtime stage (standard — debian:12-slim with shared libs) ────────────
FROM debian:12-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends libssl3 zlib1g libjsoncpp25 \
 && rm -rf /var/lib/apt/lists/*
RUN useradd -u 1001 -r app
COPY --from=build /app/build/app /usr/local/bin/app
USER app
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/app"]

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: ubuntu:24.04 — when Debian slim is missing a required shared lib
#FROM ubuntu:24.04 AS runtime
#RUN apt-get update && apt-get install -y --no-install-recommends libssl3 zlib1g libjsoncpp25 && rm -rf /var/lib/apt/lists/*
#RUN useradd -u 1001 -r app
#COPY --from=build /app/build/app /usr/local/bin/app
#USER app
#EXPOSE 8080
#ENTRYPOINT ["/usr/local/bin/app"]

# Option: alpine:3.21 — smallest with shared lib support; may need musl recompile
#FROM alpine:3.21 AS runtime
#RUN apk add --no-cache libssl3 zlib libjsoncpp && adduser -D -u 1001 app
#COPY --from=build /app/build/app /usr/local/bin/app
#USER app
#EXPOSE 8080
#ENTRYPOINT ["/usr/local/bin/app"]

# ── Runtime — FIPS (ubi-micro) ────────────────────────────────────────────
FROM registry.access.redhat.com/ubi9/ubi-micro AS runtime-fips
COPY --from=build /app/build/app /usr/local/bin/app
USER 1001
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/app"]
