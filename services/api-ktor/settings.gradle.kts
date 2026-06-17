rootProject.name = "18-ktor"

// Foojay resolver auto-provisions the JDK 21 toolchain (jvmToolchain in
// build.gradle.kts) when the host JVM does not match. Required on Gradle 9 so
// the build works on a JDK-17-only host and in CI alike. 1.0.0 = Gradle 9 ready.
plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}
