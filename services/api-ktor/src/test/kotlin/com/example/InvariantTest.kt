package com.example

import com.example.auth.JwtService
import com.example.db.tables.Users
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID
import kotlin.test.*

/**
 * Yarova platform invariant suite for the 18-ktor canonical service.
 *
 * Each test maps to one platform invariant by I-id. The invariant is the
 * contract; the test is the runtime proof. Never weaken a test to make it pass.
 *
 * Protected route under test: GET/POST /users/me/items (wrapped in AuthPlugin).
 * Valid token: minted exactly as the app verifies it — JwtService.signToken,
 * HMAC256 over JWT_SECRET, issuer "pipeline-studio".
 */
class InvariantTest {

    private val userId = UUID.randomUUID()

    // A valid token minted by the same code path the server verifies with.
    private val validToken =
        JwtService.signToken(userId.toString(), "invariant@example.com", "Invariant User")

    private fun testApp(block: suspend ApplicationTestBuilder.() -> Unit) = testApplication {
        application { module() }
        // Force eager boot so DatabaseFactory.init() runs Database.connect()
        // before the seed transaction. testApplication boots lazily otherwise.
        startApplication()
        transaction {
            Users.insert {
                it[id]       = userId
                it[email]    = "invariant@example.com"
                it[name]     = "Invariant User"
                it[provider] = "local"
            }
        }
        block()
    }

    // ── I-3: no Authorization header on a protected route → 401 ──────────────
    @Test
    fun `I-3 protected route with no Authorization header returns 401`() = testApp {
        val r = client.get("/users/me/items")
        assertEquals(HttpStatusCode.Unauthorized, r.status)
    }

    // ── I-4: garbage / tampered Bearer token → 401 ───────────────────────────
    @Test
    fun `I-4 protected route with tampered Bearer token returns 401`() = testApp {
        // Tamper: take a valid token and corrupt its signature segment.
        val tampered = validToken.dropLast(4) + "AAAA"
        val r1 = client.get("/users/me/items") {
            header(HttpHeaders.Authorization, "Bearer $tampered")
        }
        assertEquals(HttpStatusCode.Unauthorized, r1.status)

        // Pure garbage that is not even a JWT.
        val r2 = client.get("/users/me/items") {
            header(HttpHeaders.Authorization, "Bearer not-a-real-jwt-token")
        }
        assertEquals(HttpStatusCode.Unauthorized, r2.status)
    }

    // ── I-6: valid token + unknown extra JSON field → 400 (strict body) ──────
    @Test
    fun `I-6 valid token with unknown JSON field returns 400 not 500`() = testApp {
        val r = client.post("/users/me/items") {
            header(HttpHeaders.Authorization, "Bearer $validToken")
            contentType(ContentType.Application.Json)
            // "title" is valid; "unexpected_field" is unknown → strict Json rejects it.
            setBody("""{"title":"ok","unexpected_field":"boom"}""")
        }
        assertEquals(HttpStatusCode.BadRequest, r.status)
        // Must be a clean 400 mapped by StatusPages, never a leaked 500.
        assertNotEquals(HttpStatusCode.InternalServerError, r.status)
    }

    // ── I-10: liveness probe → 200 ───────────────────────────────────────────
    @Test
    fun `I-10 health live returns 200`() = testApp {
        val r = client.get("/health/live")
        assertEquals(HttpStatusCode.OK, r.status)
    }

    // ── I-13: /metrics → 200 and exposes the request-duration golden signal ──
    @Test
    fun `I-13 metrics endpoint exposes request duration golden signal`() = testApp {
        // Generate at least one timed request so the Timer registers a sample.
        client.get("/health/live")

        val r = client.get("/metrics")
        assertEquals(HttpStatusCode.OK, r.status)
        val body = r.bodyAsText()
        assertTrue(
            body.contains("http_request_duration_seconds"),
            "metrics body must contain the request-duration golden signal; got:\n$body",
        )
    }

    // ── I-17: response carries X-Content-Type-Options: nosniff ───────────────
    @Test
    fun `I-17 response carries X-Content-Type-Options nosniff`() = testApp {
        val r = client.get("/health/live")
        assertEquals("nosniff", r.headers["X-Content-Type-Options"])
    }
}
