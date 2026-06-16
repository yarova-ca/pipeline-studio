# syntax=docker/dockerfile:1.6
# Build: Maven + Temurin 21. Runtime: distroless java21, non-root.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY src ./src
COPY compliance ./compliance
RUN mvn -B -q package -DskipTests

# I-19: distroless java runtime runs as the built-in nonroot user.
FROM gcr.io/distroless/java21-debian12:nonroot AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Industry compliance profiles are read at runtime from the working directory.
COPY --from=build /app/compliance ./compliance
ENV SERVER_PORT=8080
EXPOSE 8080
USER nonroot
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
