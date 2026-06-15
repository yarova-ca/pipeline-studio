package com.example.routes

import com.example.auth.AuthPlugin
import com.example.auth.JwtService
import com.example.auth.UserAttribute
import com.example.db.tables.Users
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.jetbrains.exposed.sql.update
import java.util.UUID

private val httpClient = HttpClient(CIO) {
    install(io.ktor.client.plugins.contentnegotiation.ContentNegotiation) {
        json()
    }
}

fun Route.authRoutes() {
    // GET /auth/login → redirect to GitHub OAuth
    get("/auth/login") {
        val clientId = System.getenv("GITHUB_CLIENT_ID") ?: ""
        val redirect = System.getenv("GITHUB_REDIRECT_URI") ?: ""
        val url = "https://github.com/login/oauth/authorize" +
            "?client_id=$clientId&redirect_uri=${redirect}&scope=user:email"
        call.respond(mapOf("redirect_url" to url))
    }

    // GET /auth/callback → exchange code, upsert user, return JWT
    get("/auth/callback") {
        val code = call.request.queryParameters["code"]
        if (code.isNullOrBlank()) {
            call.respond(HttpStatusCode.UnprocessableEntity, mapOf("error" to "Missing code"))
            return@get
        }

        val tokenBody = httpClient.post("https://github.com/login/oauth/access_token") {
            contentType(ContentType.Application.Json)
            accept(ContentType.Application.Json)
            setBody(mapOf(
                "client_id"     to (System.getenv("GITHUB_CLIENT_ID") ?: ""),
                "client_secret" to (System.getenv("GITHUB_CLIENT_SECRET") ?: ""),
                "code"          to code,
                "redirect_uri"  to (System.getenv("GITHUB_REDIRECT_URI") ?: ""),
            ))
        }.body<JsonObject>()

        val accessToken = tokenBody["access_token"]?.jsonPrimitive?.content
        if (accessToken.isNullOrBlank()) {
            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "OAuth exchange failed"))
            return@get
        }

        val ghUser = httpClient.get("https://api.github.com/user") {
            header("Authorization", "Bearer $accessToken")
            accept(ContentType.Application.Json)
        }.body<JsonObject>()

        val email = ghUser["email"]?.jsonPrimitive?.content
            ?: run {
                val emails = httpClient.get("https://api.github.com/user/emails") {
                    header("Authorization", "Bearer $accessToken")
                    accept(ContentType.Application.Json)
                }.body<List<JsonObject>>()
                emails.firstOrNull { it["primary"]?.jsonPrimitive?.content == "true" }
                    ?.get("email")?.jsonPrimitive?.content
            }

        if (email.isNullOrBlank()) {
            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Could not retrieve email"))
            return@get
        }

        val name = ghUser["name"]?.jsonPrimitive?.content
            ?: ghUser["login"]?.jsonPrimitive?.content
            ?: "GitHub User"

        val userId = transaction {
            val existing = Users.selectAll().where { Users.email eq email }.singleOrNull()
            if (existing != null) {
                val id = existing[Users.id].value
                Users.update({ Users.id eq id }) {
                    it[Users.name]     = name
                    it[Users.provider] = "github"
                }
                id
            } else {
                val id = UUID.randomUUID()
                Users.insert {
                    it[Users.id]       = id
                    it[Users.email]    = email
                    it[Users.name]     = name
                    it[Users.provider] = "github"
                }
                id
            }
        }

        val token = JwtService.signToken(userId.toString(), email, name)
        call.respond(mapOf("token" to token, "email" to email, "name" to name))
    }

    // GET /auth/me → authenticated
    route("/auth/me") {
        install(AuthPlugin)
        get {
            val user = call.attributes[UserAttribute]
            call.respond(mapOf("id" to user.id.toString(), "email" to user.email, "name" to user.name))
        }
    }

    // POST /auth/logout → ok
    post("/auth/logout") {
        call.respond(mapOf("message" to "Logged out"))
    }

    // POST /auth/api-key → generate and save
    route("/auth/api-key") {
        install(AuthPlugin)

        post {
            val user = call.attributes[UserAttribute]
            val key  = UUID.randomUUID().toString()
            transaction {
                Users.update({ Users.id eq user.id }) {
                    it[apiKey] = key
                }
            }
            call.respond(mapOf("api_key" to key))
        }

        delete {
            val user = call.attributes[UserAttribute]
            transaction {
                Users.update({ Users.id eq user.id }) {
                    it[apiKey] = null
                }
            }
            call.respond(mapOf("message" to "API key revoked"))
        }
    }

    // POST /dev/token → non-production only
    post("/dev/token") {
        val env = System.getenv("KTOR_ENV") ?: "local"
        if (env == "production") {
            call.respond(HttpStatusCode.Forbidden, mapOf("error" to "Not available"))
            return@post
        }

        val body  = call.receiveNullable<Map<String, String>>() ?: emptyMap()
        val email = body["email"] ?: "dev@example.com"
        val name  = body["name"]  ?: "Dev User"

        val userId = transaction {
            val existing = Users.selectAll().where { Users.email eq email }.singleOrNull()
            if (existing != null) {
                existing[Users.id].value
            } else {
                val id = UUID.randomUUID()
                Users.insert {
                    it[Users.id]       = id
                    it[Users.email]    = email
                    it[Users.name]     = name
                    it[Users.provider] = "local"
                }
                id
            }
        }

        val token = JwtService.signToken(userId.toString(), email, name)
        call.respond(mapOf("token" to token, "email" to email, "name" to name))
    }
}
