package com.example

import com.example.auth.JwtService
import com.example.db.DatabaseFactory
import com.example.db.tables.Users
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID
import kotlin.test.*

class AuthRoutesTest {

    private fun testApp(block: suspend ApplicationTestBuilder.() -> Unit) = testApplication {
        application { module() }
        block()
    }

    @Test
    fun `GET auth me without auth returns 401`() = testApp {
        val r = client.get("/auth/me")
        assertEquals(HttpStatusCode.Unauthorized, r.status)
    }

    @Test
    fun `GET auth me with valid JWT returns 200`() = testApp {
        val userId = UUID.randomUUID()
        transaction {
            Users.insert {
                it[id]       = userId
                it[email]    = "jwt@example.com"
                it[name]     = "JWT User"
                it[provider] = "local"
            }
        }

        val token = JwtService.signToken(userId.toString(), "jwt@example.com", "JWT User")

        val r = client.get("/auth/me") {
            header(HttpHeaders.Authorization, "Bearer $token")
        }
        assertEquals(HttpStatusCode.OK, r.status)
        assertTrue(r.bodyAsText().contains("jwt@example.com"))
    }

    @Test
    fun `GET auth me with valid API key returns 200`() = testApp {
        val userId = UUID.randomUUID()
        transaction {
            Users.insert {
                it[id]       = userId
                it[email]    = "apikey@example.com"
                it[name]     = "API Key User"
                it[apiKey]   = "test-key-abc123"
                it[provider] = "local"
            }
        }

        val r = client.get("/auth/me") {
            header("X-API-Key", "test-key-abc123")
        }
        assertEquals(HttpStatusCode.OK, r.status)
        assertTrue(r.bodyAsText().contains("apikey@example.com"))
    }

    @Test
    fun `POST dev token returns token in non-production env`() = testApp {
        val r = client.post("/dev/token") {
            contentType(ContentType.Application.Json)
            setBody("""{"email":"devtest@example.com","name":"Dev"}""")
        }
        assertEquals(HttpStatusCode.OK, r.status)
        assertTrue(r.bodyAsText().contains("token"))
    }

    @Test
    fun `POST auth logout returns 200`() = testApp {
        val r = client.post("/auth/logout")
        assertEquals(HttpStatusCode.OK, r.status)
    }
}
