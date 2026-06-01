# syntax=docker/dockerfile:1.6
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04

FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk \
 && rm -rf /var/lib/apt/lists/*

FROM eclipse-temurin:21-jdk-jammy AS base-sdk
FROM eclipse-temurin:21-jdk-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts* ./
RUN gradle dependencies --no-daemon 2>/dev/null || true
COPY src ./src
RUN gradle installDist --no-daemon

FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app
COPY --from=build /app/build/install/28-kotlin-grpc .
ENV GRPC_PORT=50051
EXPOSE 50051
CMD ["bin/28-kotlin-grpc"]
