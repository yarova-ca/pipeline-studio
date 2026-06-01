# syntax=docker/dockerfile:1.6
ARG BUILD_IMAGE=ubuntu
ARG BUILD_BASE=ubuntu:24.04
ARG RUNTIME=temurin

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
RUN printf 'root:x:0:0:root:/root:/bin/sh\nnobody:x:65534:65534:nobody:/nonexistent:/bin/false\napp:x:1001:1001::/home/app:/sbin/nologin\n' > /tmp/app-passwd \
 && printf 'root:x:0:\nnobody:x:65534:\napp:x:1001:\n' > /tmp/app-group

FROM eclipse-temurin:21-jre-jammy AS base-temurin
FROM gcr.io/distroless/java21-debian12 AS base-distroless
FROM registry.access.redhat.com/ubi9/openjdk-21-runtime AS base-fips

FROM base-${RUNTIME} AS runtime
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/target/*.jar app.jar
ENV GRPC_PORT=50051 HTTP_PORT=8080
USER 1001
EXPOSE 50051 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:50051/health/live || exit 1

CMD ["java", "-jar", "app.jar"]

FROM base-fips AS runtime-fips
WORKDIR /app
COPY --from=build /tmp/app-passwd /etc/passwd
COPY --from=build /tmp/app-group /etc/group
COPY --from=build --chown=1001:1001 /app/target/*.jar app.jar
ENV GRPC_PORT=50051 HTTP_PORT=8080
USER 1001
EXPOSE 50051 8080
CMD ["java", "-jar", "app.jar"]
