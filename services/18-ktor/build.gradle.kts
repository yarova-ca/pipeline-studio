plugins {
    kotlin("jvm") version "2.1.0"
    id("io.ktor.plugin") version "3.5.0"
    application
}

application {
    mainClass.set("com.example.ApplicationKt")
}

dependencies {
    // Ktor server
    implementation("io.ktor:ktor-server-netty")
    implementation("io.ktor:ktor-server-content-negotiation")
    implementation("io.ktor:ktor-serialization-kotlinx-json")

    // Ktor HTTP client (for GitHub OAuth callback)
    implementation("io.ktor:ktor-client-core")
    implementation("io.ktor:ktor-client-cio")
    implementation("io.ktor:ktor-client-content-negotiation")

    // Exposed ORM
    implementation("org.jetbrains.exposed:exposed-core:0.54.0")
    implementation("org.jetbrains.exposed:exposed-dao:0.54.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.54.0")

    // HikariCP connection pool
    implementation("com.zaxxer:HikariCP:5.1.0")

    // JWT
    implementation("com.auth0:java-jwt:4.4.0")

    // PostgreSQL driver (runtime)
    runtimeOnly("org.postgresql:postgresql:42.7.3")

    // H2 in-memory database for tests
    testImplementation("com.h2database:h2:2.2.224")

    // Test
    testImplementation("io.ktor:ktor-server-test-host")
    testImplementation("org.jetbrains.kotlin:kotlin-test")
}
