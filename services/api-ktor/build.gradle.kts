plugins {
    kotlin("jvm") version "2.3.21"
    id("io.ktor.plugin") version "3.5.0"
    kotlin("plugin.serialization") version "2.3.21"
    application
}

application {
    mainClass.set("com.example.ApplicationKt")
}

repositories {
    mavenCentral()
}

val otelVersion = "1.29.0"

dependencies {
    // Ktor server
    implementation("io.ktor:ktor-server-netty")
    implementation("io.ktor:ktor-server-content-negotiation")
    implementation("io.ktor:ktor-serialization-kotlinx-json")

    // Ktor call logging (structured via SLF4J + Logback JSON)
    implementation("io.ktor:ktor-server-call-logging")

    // I-17 default headers + I-13 Prometheus metrics
    implementation("io.ktor:ktor-server-default-headers")
    implementation("io.ktor:ktor-server-metrics-micrometer")
    implementation("io.micrometer:micrometer-registry-prometheus:1.13.6")

    // Ktor HTTP client (for GitHub OAuth callback)
    implementation("io.ktor:ktor-client-core")
    implementation("io.ktor:ktor-client-cio")
    implementation("io.ktor:ktor-client-content-negotiation")

    // Logback JSON encoder for structured logging
    implementation("ch.qos.logback:logback-classic:1.5.6")
    implementation("net.logstash.logback:logstash-logback-encoder:7.4")

    // Exposed ORM
    implementation("org.jetbrains.exposed:exposed-core:0.54.0")
    implementation("org.jetbrains.exposed:exposed-dao:0.54.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.54.0")

    // HikariCP connection pool
    implementation("com.zaxxer:HikariCP:5.1.0")

    // JWT
    implementation("com.auth0:java-jwt:4.4.0")

    // OpenTelemetry — guarded by OTEL_ENABLED=true in Application.kt
    implementation("io.opentelemetry:opentelemetry-api:$otelVersion")
    implementation("io.opentelemetry:opentelemetry-sdk:$otelVersion")
    implementation("io.opentelemetry:opentelemetry-exporter-otlp:$otelVersion")

    // Kotlinx serialization (JSON content negotiation + the OpenAPI spec payload)
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.1")

    // PostgreSQL driver (runtime)
    runtimeOnly("org.postgresql:postgresql:42.7.3")

    // H2 in-memory database for tests
    testImplementation("com.h2database:h2:2.2.224")

    // Test
    testImplementation("io.ktor:ktor-server-test-host")
    testImplementation("org.jetbrains.kotlin:kotlin-test")
}
