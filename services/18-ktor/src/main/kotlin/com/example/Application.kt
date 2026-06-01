package com.example

import com.example.db.DatabaseFactory
import com.example.routes.authRoutes
import com.example.routes.userItemRoutes
import io.github.smiley4.ktoropenapi.OpenApi
import io.github.smiley4.ktoropenapi.config.OutputFormat
import io.github.smiley4.ktorswaggerui.SwaggerUI
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.calllogging.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.transactions.transaction
import org.slf4j.LoggerFactory
import org.slf4j.event.Level
import java.util.concurrent.atomic.AtomicLong

private val log = LoggerFactory.getLogger("Application")

@Serializable
data class HelloResponse(val message: String, val framework: String, val version: String)

@Serializable
data class HealthResponse(val status: String, val version: String? = null, val db: String? = null)

@Serializable
data class ErrorResponse(val error: String)

/**
 * Token-bucket rate limiter — 100 requests per minute (process-wide).
 * Health and docs endpoints are exempt so k8s probes are never blocked.
 * For per-IP limiting in production use a Redis-backed bucket.
 */
object RateLimiter {
    private const val CAPACITY = 100L
    private const val REFILL_PERIOD_MS = 60_000L

    private val tokens = AtomicLong(CAPACITY)
    private var lastRefill = System.currentTimeMillis()

    @Synchronized
    fun tryConsume(): Boolean {
        val now = System.currentTimeMillis()
        val elapsed = now - lastRefill
        if (elapsed >= REFILL_PERIOD_MS) {
            tokens.set(CAPACITY)
            lastRefill = now
        }
        return tokens.getAndUpdate { if (it > 0) it - 1 else 0 } > 0
    }
}

/**
 * Initialise OpenTelemetry when OTEL_ENABLED=true.
 * No-op when the env var is absent so the service starts without a collector.
 */
fun initOTel() {
    if (System.getenv("OTEL_ENABLED") != "true") return

    try {
        val exporter = io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter.builder().build()
        val resource = io.opentelemetry.sdk.resources.Resource.getDefault().merge(
            io.opentelemetry.sdk.resources.Resource.create(
                io.opentelemetry.api.common.Attributes.of(
                    io.opentelemetry.semconv.resource.attributes.ResourceAttributes.SERVICE_NAME,
                    "18-ktor"
                )
            )
        )
        val tracerProvider = io.opentelemetry.sdk.trace.SdkTracerProvider.builder()
            .addSpanProcessor(
                io.opentelemetry.sdk.trace.export.BatchSpanProcessor.builder(exporter).build()
            )
            .setResource(resource)
            .build()
        io.opentelemetry.api.GlobalOpenTelemetry.set(
            io.opentelemetry.sdk.OpenTelemetrySdk.builder()
                .setTracerProvider(tracerProvider)
                .build()
        )
        log.info("OTel enabled, endpoint: {}", System.getenv("OTEL_EXPORTER_OTLP_ENDPOINT") ?: "default")
    } catch (e: Exception) {
        log.warn("OTel init failed (non-fatal): ${e.message}")
    }
}

fun Application.module() {
    install(ContentNegotiation) {
        json()
    }

    // Structured JSON logging for each request via CallLogging plugin.
    // SLF4J → logback.xml → logstash-logback-encoder → JSON stdout.
    install(CallLogging) {
        level = Level.INFO
        format { call ->
            val status = call.response.status()?.value ?: 0
            val method = call.request.httpMethod.value
            val path = call.request.path()
            "{\"event\":\"request\",\"method\":\"$method\",\"path\":\"$path\",\"status\":$status}"
        }
    }

    // OpenAPI spec at /docs.json, Swagger UI at /docs.
    install(OpenApi) {
        outputFormat = OutputFormat.JSON
        info {
            title = "Ktor Service API"
            version = "1.0.0"
            description = "18-ktor canonical service"
        }
    }
    install(SwaggerUI) {
        swaggerUrl = "docs"
        forwardRoot = false
    }

    DatabaseFactory.init()

    routing {
        // ── Rate limiting ────────────────────────────────────────────────────
        // Applied before any route processing. Health and docs endpoints are exempt.
        intercept(ApplicationCallPipeline.Plugins) {
            val path = call.request.path()
            if (!path.startsWith("/health") && !path.startsWith("/docs")) {
                if (!RateLimiter.tryConsume()) {
                    call.respond(
                        HttpStatusCode.TooManyRequests,
                        ErrorResponse("Too many requests — try again in 60 seconds")
                    )
                    finish()
                    return@intercept
                }
            }
        }

        get("/") {
            call.respond(HelloResponse("Hello from Ktor 3.5", "18-ktor", "1.0.0"))
        }
        get("/health") {
            call.respond(HealthResponse("ok", "1.0.0"))
        }
        get("/health/live") {
            call.respond(HealthResponse("ok"))
        }

        // DB-checking readiness probe.
        // Returns 503 when the database is unreachable so k8s removes the pod
        // from the load balancer until the connection recovers.
        get("/health/ready") {
            try {
                transaction {
                    exec("SELECT 1") { }
                }
                call.respond(HealthResponse("ok", db = "connected"))
            } catch (e: Exception) {
                log.error("health/ready db check failed", e)
                call.respond(
                    HttpStatusCode.ServiceUnavailable,
                    HealthResponse("error", db = "disconnected")
                )
            }
        }

        authRoutes()
        userItemRoutes()
    }
}

fun main() {
    initOTel()
    val port = System.getenv("SERVER_PORT")?.toInt() ?: 8080
    embeddedServer(Netty, port = port, module = Application::module).start(wait = true)
}
