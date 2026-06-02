plugins {
    kotlin("jvm") version "1.9.0"
    application
}
repositories { mavenCentral() }
dependencies {
    implementation("io.grpc:grpc-kotlin-stub:1.4.0")
    implementation("io.grpc:grpc-protobuf:1.63.0")
    implementation("io.grpc:grpc-netty-shaded:1.63.0")
    implementation("io.grpc:grpc-services:1.63.0")
    // JSON logging
    implementation("net.logstash.logback:logstash-logback-encoder:7.4")
    // Prometheus metrics
    implementation("io.micrometer:micrometer-registry-prometheus")
}
application { mainClass.set("ca.yarova.grpc.ServerKt") }
