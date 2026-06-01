# ─────────────────────────────────────────────────────────────────────────
# Framework: 18 Kotlin — Ktor 3.5
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Gradle + OpenJDK 21)
# Runtime:   gcr.io/distroless/java21-debian12 (default) | eclipse-temurin:21-jre-alpine | ubi9/openjdk-21-runtime
# Port:      8080
# Ktor: ./gradlew shadowJar produces build/libs/*-all.jar
# RUNTIME build-arg: distroless (default) | temurin | fips
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
ARG RUNTIME=distroless
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk \
 && rm -rf /var/lib/apt/lists/*

FROM eclipse-temurin:21-jdk-jammy AS base-sdk
FROM eclipse-temurin:21-jdk-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts gradlew ./
COPY gradle ./gradle
RUN ./gradlew dependencies -q
COPY src ./src
RUN ./gradlew shadowJar -q
# REPLACE: use bootJar for Spring Boot Kotlin; shadowJar for Ktor
RUN printf 'root:x:0:0:root:/root:/bin/sh\nnobody:x:65534:65534:nobody:/nonexistent:/bin/false\napp:x:1001:1001::/home/app:/sbin/nologin\n' > /tmp/app-passwd \
 && printf 'root:x:0:\nnobody:x:65534:\napp:x:1001:\n' > /tmp/app-group

# ── Base image stages (no RUN — selection only) ───────────────────────────
FROM gcr.io/distroless/java21-debian12 AS base-distroless
FROM eclipse-temurin:21-jre-alpine AS base-temurin
FROM registry.access.redhat.com/ubi9/openjdk-21-runtime AS base-fips

# ── Runtime stage (ARG-selectable) ────────────────────────────────────────
FROM base-${RUNTIME} AS runtime
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/build/libs/*-all.jar app.jar
USER 1001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# ── Runtime — FIPS ────────────────────────────────────────────────────────
FROM base-fips AS runtime-fips
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/build/libs/*-all.jar app.jar
USER 1001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
