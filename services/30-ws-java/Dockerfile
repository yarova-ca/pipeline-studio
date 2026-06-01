# syntax=docker/dockerfile:1.6
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04

FROM ubuntu:24.04 AS base-ubuntu
RUN apt-get update && apt-get install -y --no-install-recommends maven openjdk-21-jdk \
 && rm -rf /var/lib/apt/lists/*

FROM eclipse-temurin:21-jdk-jammy AS base-sdk
FROM eclipse-temurin:21-jdk-alpine AS base-sdk-alpine
FROM ${BUILD_BASE} AS base-custom

FROM base-${BUILD_IMAGE} AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B 2>/dev/null || true
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV PORT=8080
EXPOSE 8080 8081
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health/live || exit 1

CMD ["java", "-jar", "app.jar"]
