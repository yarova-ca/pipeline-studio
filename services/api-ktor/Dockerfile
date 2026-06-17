# syntax=docker/dockerfile:1.6
# Build: Gradle 9 + JDK 25 (no wrapper committed). Runtime: distroless java25, non-root.
FROM gradle:9.5.1-jdk25-corretto AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src
RUN gradle --no-daemon shadowJar

# I-19: distroless java runtime runs as the built-in nonroot user.
FROM gcr.io/distroless/java25-debian13:nonroot AS runtime
WORKDIR /app
COPY --from=build /app/build/libs/*-all.jar app.jar
# Industry compliance profiles are read at runtime from the working directory.
COPY compliance ./compliance
ENV SERVER_PORT=8080
EXPOSE 8080
USER nonroot
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
