package com.example.auth

import com.example.db.tables.Users
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.util.*
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.and
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID

data class AuthUser(
    val id: UUID,
    val email: String,
    val name: String,
)

val UserAttribute = AttributeKey<AuthUser>("AuthUser")

val AuthPlugin = createRouteScopedPlugin("AuthPlugin") {
    onCall { call ->
        val user = resolveUser(call)
        if (user == null) {
            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Unauthorized"))
            return@onCall
        }
        call.attributes.put(UserAttribute, user)
    }
}

private fun resolveUser(call: ApplicationCall): AuthUser? {
    val authHeader = call.request.headers["Authorization"]
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        val token  = authHeader.removePrefix("Bearer ").trim()
        val claims = JwtService.verifyToken(token) ?: return null
        return AuthUser(
            id    = UUID.fromString(claims.userId),
            email = claims.email,
            name  = claims.name,
        )
    }

    val apiKey = call.request.headers["X-API-Key"]
    if (apiKey != null) {
        return transaction {
            Users.selectAll().where { Users.apiKey eq apiKey }
                .singleOrNull()
                ?.let { row ->
                    AuthUser(
                        id    = row[Users.id].value,
                        email = row[Users.email],
                        name  = row[Users.name],
                    )
                }
        }
    }

    return null
}
