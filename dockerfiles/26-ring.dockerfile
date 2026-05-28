# ─────────────────────────────────────────────────────────────────────────
# Framework: 26 Clojure — Ring 1.12
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Leiningen + OpenJDK 21)
# Runtime:   gcr.io/distroless/java21-debian12 (distroless)
# FIPS:      registry.access.redhat.com/ubi9/openjdk-21-runtime
# Port:      8080
# Ring: lein uberjar produces target/*-standalone.jar
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk curl \
 && curl -fL https://raw.githubusercontent.com/technomancy/leiningen/stable/bin/lein > /usr/local/bin/lein \
 && chmod +x /usr/local/bin/lein \
 && lein version \
 && rm -rf /var/lib/apt/lists/*
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

# ── Runtime — FIPS (OpenJDK 21 on UBI9) ──────────────────────────────────
FROM registry.access.redhat.com/ubi9/openjdk-21-runtime AS runtime-fips
WORKDIR /deployments
COPY --from=build /app/target/*-standalone.jar /deployments/app.jar
USER 1001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/deployments/app.jar"]
