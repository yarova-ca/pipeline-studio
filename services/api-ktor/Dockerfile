# syntax=docker/dockerfile:1.6
# Build: Gradle + JDK 21 (no wrapper committed). Runtime: distroless java21, non-root.
FROM gradle:8.13-jdk21 AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src
RUN gradle --no-daemon shadowJar

# I-19: distroless java runtime runs as the built-in nonroot user.
FROM gcr.io/distroless/java21-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=build /app/build/libs/*-all.jar app.jar
ENV SERVER_PORT=8080
EXPOSE 8080
USER nonroot
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
