# ─────────────────────────────────────────────────────────────────────────
# Framework: 25 Scala — Play 3.0
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (sbt + OpenJDK 21)
# Runtime:   gcr.io/distroless/java21-debian12 (distroless)
# FIPS:      registry.access.redhat.com/ubi9/openjdk-21-runtime
# Port:      9000
# Play: sbt dist; unzip dist/universal/*.zip; run bin/<app-name>
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk curl \
 && curl -fL https://github.com/sbt/sbt/releases/download/v1.10.5/sbt-1.10.5.tgz | tar -xz -C /usr/local \
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/usr/local/sbt/bin:$PATH" 
WORKDIR /app
COPY build.sbt ./
COPY project ./project
RUN sbt update
COPY src ./src
RUN sbt assembly
# REPLACE: if using Play Framework use 'sbt dist' and unzip the zip file

# ── Runtime stage (standard — distroless) ─────────────────────────────────
FROM gcr.io/distroless/java21-debian12 AS runtime
WORKDIR /app
COPY --from=build /app/target/scala-*/*-assembly-*.jar app.jar
USER 65534:65534
EXPOSE 9000
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# ── Runtime — FIPS (OpenJDK 21 on UBI9) ──────────────────────────────────
FROM registry.access.redhat.com/ubi9/openjdk-21-runtime AS runtime-fips
WORKDIR /deployments
COPY --from=build /app/target/scala-*/*-assembly-*.jar /deployments/app.jar
USER 1001
EXPOSE 9000
ENTRYPOINT ["java", "-jar", "/deployments/app.jar"]
