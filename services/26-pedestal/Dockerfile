# ─────────────────────────────────────────────────────────────────────────
# Framework: 26 Clojure — Pedestal 0.7
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Leiningen + OpenJDK 21)
# Runtime:   gcr.io/distroless/java21-debian12 (distroless)
# FIPS:      registry.access.redhat.com/ubi9/openjdk-21-runtime
# Port:      8080
# Pedestal: same uberjar pattern as Ring
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk curl \
 && curl -fL https://raw.githubusercontent.com/technomancy/leiningen/stable/bin/lein > /usr/local/bin/lein \
 && chmod +x /usr/local/bin/lein \
 && lein version \
 && rm -rf /var/lib/apt/lists/*

FROM clojure:tools-deps-bookworm AS base-sdk
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY project.clj ./
RUN lein deps
COPY src ./src
COPY resources ./resources
RUN lein uberjar

# ── Runtime stage (standard — distroless) ─────────────────────────────────
FROM gcr.io/distroless/java21-debian12 AS runtime
WORKDIR /app
COPY --from=build /app/target/*-standalone.jar app.jar
USER 65534:65534
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# ── Alternative runtime images ─────────────────────────────────────────────
# Uncomment ONE block below instead of the standard runtime above.
# Delete the standard block and all unused alternatives to keep it clean.

# Option: eclipse-temurin:21-jre-alpine — smaller Alpine JRE, shell available for debugging
#FROM eclipse-temurin:21-jre-alpine AS runtime
#WORKDIR /app
#RUN adduser -D -u 1001 app
#COPY --from=build /app/target/*-standalone.jar app.jar
#USER 1001
#EXPOSE 8080
#ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# Option: amazoncorretto:21-al2023-jdk — Amazon Corretto on Amazon Linux 2023
#FROM amazoncorretto:21-al2023-jdk AS runtime
#WORKDIR /app
#RUN useradd -u 1001 -r app
#COPY --from=build /app/target/*-standalone.jar app.jar
#USER 1001
#EXPOSE 8080
#ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# ── Runtime — FIPS (OpenJDK 21 on UBI9) ──────────────────────────────────
FROM registry.access.redhat.com/ubi9/openjdk-21-runtime AS runtime-fips
WORKDIR /deployments
COPY --from=build /app/target/*-standalone.jar /deployments/app.jar
USER 1001
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
ENTRYPOINT ["java", "-jar", "/deployments/app.jar"]
