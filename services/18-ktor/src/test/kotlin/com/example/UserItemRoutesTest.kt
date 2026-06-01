package com.example

import com.example.auth.JwtService
import com.example.db.tables.Items
import com.example.db.tables.Users
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID
import kotlin.test.*

class UserItemRoutesTest {

    private val userId  = UUID.randomUUID()
    private val token   = JwtService.signToken(userId.toString(), "items@example.com", "Items User")

    private fun testApp(block: suspend ApplicationTestBuilder.() -> Unit) = testApplication {
        application { module() }

        // Seed user in H2 in-memory DB before each test block
        transaction {
            Users.insert {
                it[id]       = userId
                it[email]    = "items@example.com"
                it[name]     = "Items User"
                it[provider] = "local"
            }
        }

        block()
    }

    private fun HttpRequestBuilder.bearerAuth() {
        header(HttpHeaders.Authorization, "Bearer $token")
    }

    @Test
    fun `GET users me items returns empty list initially`() = testApp {
        val r = client.get("/users/me/items") { bearerAuth() }
        assertEquals(HttpStatusCode.OK, r.status)
        assertTrue(r.bodyAsText().contains("[]") || r.bodyAsText().contains("[ ]"))
    }

    @Test
    fun `POST users me items creates item`() = testApp {
        val r = client.post("/users/me/items") {
            bearerAuth()
            contentType(ContentType.Application.Json)
            setBody("""{"title":"My Item","description":"desc"}""")
        }
        assertEquals(HttpStatusCode.Created, r.status)
        assertTrue(r.bodyAsText().contains("My Item"))
    }

    @Test
    fun `POST users me items without title returns 400`() = testApp {
        val r = client.post("/users/me/items") {
            bearerAuth()
            contentType(ContentType.Application.Json)
            setBody("""{"description":"no title"}""")
        }
        assertEquals(HttpStatusCode.BadRequest, r.status)
    }

    @Test
    fun `GET users me items by id returns item`() = testApp {
        val itemId = UUID.randomUUID()
        transaction {
            Items.insert {
                it[id]          = itemId
                it[title]       = "Fetchable Item"
                it[description] = null
                it[Items.userId] = userId
            }
        }

        val r = client.get("/users/me/items/$itemId") { bearerAuth() }
        assertEquals(HttpStatusCode.OK, r.status)
        assertTrue(r.bodyAsText().contains("Fetchable Item"))
    }

    @Test
    fun `GET users me items by id returns 404 for other user item`() = testApp {
        val otherUserId = UUID.randomUUID()
        val itemId      = UUID.randomUUID()
        transaction {
            Users.insert {
                it[id]       = otherUserId
                it[email]    = "other@example.com"
                it[name]     = "Other"
                it[provider] = "local"
            }
            Items.insert {
                it[Items.id]     = itemId
                it[title]        = "Other Item"
                it[description]  = null
                it[Items.userId] = otherUserId
            }
        }

        val r = client.get("/users/me/items/$itemId") { bearerAuth() }
        assertEquals(HttpStatusCode.NotFound, r.status)
    }

    @Test
    fun `PUT users me items updates item`() = testApp {
        val itemId = UUID.randomUUID()
        transaction {
            Items.insert {
                it[Items.id]     = itemId
                it[title]        = "Old Title"
                it[description]  = null
                it[Items.userId] = userId
            }
        }

        val r = client.put("/users/me/items/$itemId") {
            bearerAuth()
            contentType(ContentType.Application.Json)
            setBody("""{"title":"New Title"}""")
        }
        assertEquals(HttpStatusCode.OK, r.status)
        assertTrue(r.bodyAsText().contains("New Title"))
    }

    @Test
    fun `DELETE users me items returns 204`() = testApp {
        val itemId = UUID.randomUUID()
        transaction {
            Items.insert {
                it[Items.id]     = itemId
                it[title]        = "Delete Me"
                it[description]  = null
                it[Items.userId] = userId
            }
        }

        val r = client.delete("/users/me/items/$itemId") { bearerAuth() }
        assertEquals(HttpStatusCode.NoContent, r.status)
    }
}
