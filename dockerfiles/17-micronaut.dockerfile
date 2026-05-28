# ─────────────────────────────────────────────────────────────────────────
# Framework: 17 Java — Micronaut 5.0
# Pattern:   Multi-stage Docker
# Build:     ubuntu:24.04 (Maven + OpenJDK 21)
# Runtime:   gcr.io/distroless/java21-debian12 (distroless — no shell, minimal attack surface)
# FIPS:      registry.access.redhat.com/ubi9/openjdk-21-runtime
# Port:      8080
# Micronaut: mvn package produces target/*.jar
# ─────────────────────────────────────────────────────────────────────────

# ── Build stage ───────────────────────────────────────────────────────────
FROM ubuntu:24.04 AS build
RUN apt-get update && apt-get install -y --no-install-recommends maven openjdk-21-jdk \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pom.xml ./
RUN mvn dependency:go-offline -B -q
COPY src ./src
RUN mvn package -DskipTests -B -q
# REPLACE: if using Gradle, use: COPY build.gradle.kts settings.gradle.kts ./
# REPLACE: ./gradlew shadowJar or ./gradlew bootJar

# ── Runtime stage (standard — distroless) ─────────────────────────────────
FROM gcr.io/distroless/java21-debian12 AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER 65534:65534
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

# ── Runtime — FIPS (OpenJDK 21 on UBI9) ──────────────────────────────────
FROM registry.access.redhat.com/ubi9/openjdk-21-runtime AS runtime-fips
WORKDIR /deployments
COPY --from=build /app/target/*.jar /deployments/app.jar
USER 1001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/deployments/app.jar"]
