plugins {
    kotlin("jvm") version "2.3.21"
    id("io.ktor.plugin") version "3.5.0"
    kotlin("plugin.serialization") version "2.3.21"
    application
}

application {
    mainClass.set("com.example.ApplicationKt")
}

kotlin {
    // Compile to Java 21 bytecode. Runtime image is Java 25 (distroless java25),
    // which runs Java 21 bytecode unchanged. A JDK 21 toolchain auto-provisions
    // reliably via Gradle on hosts that only ship JDK 17, keeping the build working.
    jvmToolchain(21)
}

repositories {
    mavenCentral()
}

val otelVersion = "1.51.0"

dependencies {
    // Ktor server
    implementation("io.ktor:ktor-server-netty")
    implementation("io.ktor:ktor-server-content-negotiation")
    implementation("io.ktor:ktor-serialization-kotlinx-json")

    // Ktor call logging (structured via SLF4J + Logback JSON)
    implementation("io.ktor:ktor-server-call-logging")

    // I-6 StatusPages: map serialization/bad-body failures to 400, not 500
    implementation("io.ktor:ktor-server-status-pages")

    // I-17 default headers + I-13 Prometheus metrics
    implementation("io.ktor:ktor-server-default-headers")
    implementation("io.ktor:ktor-server-metrics-micrometer")
    implementation("io.micrometer:micrometer-registry-prometheus:1.15.0")

    // Ktor HTTP client (for GitHub OAuth callback)
    implementation("io.ktor:ktor-client-core")
    implementation("io.ktor:ktor-client-cio")
    implementation("io.ktor:ktor-client-content-negotiation")

    // Logback JSON encoder for structured logging
    implementation("ch.qos.logback:logback-classic:1.5.18")
    implementation("net.logstash.logback:logstash-logback-encoder:8.1")

    // Exposed ORM
    implementation("org.jetbrains.exposed:exposed-core:0.61.0")
    implementation("org.jetbrains.exposed:exposed-dao:0.61.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.61.0")

    // HikariCP connection pool
    implementation("com.zaxxer:HikariCP:6.3.0")

    // JWT
    implementation("com.auth0:java-jwt:4.5.2")

    // OpenTelemetry — guarded by OTEL_ENABLED=true in Application.kt
    implementation("io.opentelemetry:opentelemetry-api:$otelVersion")
    implementation("io.opentelemetry:opentelemetry-sdk:$otelVersion")
    implementation("io.opentelemetry:opentelemetry-exporter-otlp:$otelVersion")

    // Kotlinx serialization (JSON content negotiation + the OpenAPI spec payload)
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")

    // PostgreSQL driver (runtime)
    runtimeOnly("org.postgresql:postgresql:42.7.7")

    // H2 in-memory database for tests
    testImplementation("com.h2database:h2:2.3.232")

    // Test
    testImplementation("io.ktor:ktor-server-test-host")
    testImplementation("org.jetbrains.kotlin:kotlin-test")
}
