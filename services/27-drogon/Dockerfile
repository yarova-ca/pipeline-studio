# ─────────────────────────────────────────────────────────────────────────
# Framework: 27 C/C++ — Drogon 1.9.13
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (CMake + Clang + dependencies)
# Runtime:   debian:12-slim (debian slim — shared libs required)
# FIPS:      registry.access.redhat.com/ubi9/ubi-micro
# Port:      8080
# Drogon: cmake --build outputs app binary; requires shared libs so uses debian:12-slim not scratch
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends cmake ninja-build clang git ca-certificates pkg-config \
    libssl-dev zlib1g-dev libjsoncpp-dev uuid-dev libpq-dev libpqxx-dev libbrotli-dev libgtest-dev libdrogon-dev libsqlite3-dev libmariadb-dev libmariadb-dev-compat libhiredis-dev libyaml-cpp-dev \
 && rm -rf /var/lib/apt/lists/*

FROM debian:bookworm AS base-sdk
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY CMakeLists.txt main.cc ./
COPY src ./src
COPY tests ./tests
RUN cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_COMPILER=clang++ \
    -DCMAKE_CXX_SCAN_FOR_MODULES=OFF \
 && cmake --build build --parallel $(nproc) --target 27-drogon
# Binary name is the CMake target: 27-drogon

# ── Runtime stage (standard — debian:12-slim with shared libs) ────────────
FROM debian:12-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends libssl3 zlib1g libjsoncpp25 libpqxx-6.4 libpq5 libuuid1 libsqlite3-0 libmariadb3 libhiredis0.14 libyaml-cpp0.7 \
 && rm -rf /var/lib/apt/lists/*
RUN useradd -u 1001 -r app
COPY --from=build /app/build/27-drogon /usr/local/bin/app
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
COPY --from=build /app/build/27-drogon /usr/local/bin/app
USER 1001
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/app"]
