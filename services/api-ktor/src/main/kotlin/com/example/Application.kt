package com.example

import com.example.db.DatabaseFactory
import com.example.routes.authRoutes
import com.example.routes.userItemRoutes
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.calllogging.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.plugins.BadRequestException
import io.ktor.server.metrics.micrometer.*
import io.micrometer.prometheusmetrics.PrometheusConfig
import io.micrometer.prometheusmetrics.PrometheusMeterRegistry
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

@Serializable
data class ComplianceResponse(
    val profile: String,
    val name: String,
    val jurisdiction: String,
    val controls: Map<String, kotlinx.serialization.json.JsonElement>,
)

// I-7: minimal OpenAPI 3.0 spec, served from the code at /docs.json.
private val OPENAPI_SPEC = """
{
  "openapi": "3.0.3",
  "info": { "title": "Ktor Service API", "version": "1.0.0", "description": "18-ktor canonical service" },
  "paths": {
    "/": { "get": { "summary": "Hello", "responses": { "200": { "description": "OK" } } } },
    "/health/live": { "get": { "summary": "Liveness", "responses": { "200": { "description": "OK" } } } },
    "/health/ready": { "get": { "summary": "Readiness", "responses": { "200": { "description": "OK" }, "503": { "description": "DB down" } } } },
    "/metrics": { "get": { "summary": "Prometheus metrics", "responses": { "200": { "description": "OK" } } } }
  }
}
""".trimIndent()

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
        // service.name is set via the OTEL_RESOURCE_ATTRIBUTES env var
        // (e.g. service.name=18-ktor) — the standard OTel resource convention.
        val tracerProvider = io.opentelemetry.sdk.trace.SdkTracerProvider.builder()
            .addSpanProcessor(
                io.opentelemetry.sdk.trace.export.BatchSpanProcessor.builder(exporter).build()
            )
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
        // Default kotlinx Json: ignoreUnknownKeys = false (strict).
        // I-6: an unknown JSON field therefore throws during call.receive(),
        // and the StatusPages handler below maps that failure to 400 (not 500).
        json()
    }

    // I-6: a malformed body or unknown JSON field must surface as 400, never 500.
    // Ktor wraps a kotlinx SerializationException from call.receive() in a
    // BadRequestException; StatusPages maps both to a clean 400 response.
    install(StatusPages) {
        exception<BadRequestException> { call, _ ->
            call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid request body"))
        }
        exception<kotlinx.serialization.SerializationException> { call, _ ->
            call.respond(HttpStatusCode.BadRequest, ErrorResponse("Invalid request body"))
        }
    }

    // I-17: security headers on every response.
    install(DefaultHeaders) {
        header("X-Content-Type-Options", "nosniff")
        header("X-Frame-Options", "DENY")
        header("Referrer-Policy", "strict-origin-when-cross-origin")
    }

    // I-13: golden-signal metrics in Prometheus format, exposed at /metrics below.
    val prometheusRegistry = PrometheusMeterRegistry(PrometheusConfig.DEFAULT)
    install(MicrometerMetrics) {
        registry = prometheusRegistry
        // I-13: emit the canonical request-duration golden signal.
        // Micrometer's Prometheus naming appends "_seconds" to this Timer,
        // so /metrics exposes http_request_duration_seconds.
        metricName = "http_request_duration"
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

    DatabaseFactory.init()

    routing {
        // ── Rate limiting ────────────────────────────────────────────────────
        // Applied before any route processing. Health and docs endpoints are exempt.
        intercept(ApplicationCallPipeline.Plugins) {
            val path = call.request.path()
            if (!path.startsWith("/health") && !path.startsWith("/docs") &&
                path != "/metrics" && path != "/docs.json") {
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
        // I-13: Prometheus scrape endpoint.
        get("/metrics") {
            call.respondText(prometheusRegistry.scrape())
        }
        // I-7: OpenAPI spec served from the code.
        get("/docs.json") {
            call.respondText(OPENAPI_SPEC, ContentType.Application.Json)
        }
        // The active industry profile and controls. Switch with COMPLIANCE_PROFILE.
        get("/compliance") {
            call.respond(
                ComplianceResponse(
                    profile = Compliance.profile,
                    name = Compliance.name,
                    jurisdiction = Compliance.jurisdiction,
                    controls = Compliance.controls,
                )
            )
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
    // I-1: refuse to boot on missing or weak config.
    if ((System.getenv("JWT_SECRET") ?: "").length < 32) {
        System.err.println("FATAL: JWT_SECRET must be set and at least 32 characters")
        kotlin.system.exitProcess(1)
    }
    initOTel()
    val port = System.getenv("SERVER_PORT")?.toInt() ?: 8080
    embeddedServer(Netty, port = port, module = Application::module).start(wait = true)
}
