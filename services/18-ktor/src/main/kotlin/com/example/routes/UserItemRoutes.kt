package com.example.routes

import com.example.auth.AuthPlugin
import com.example.auth.UserAttribute
import com.example.db.tables.Items
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID

@Serializable
data class ItemRequest(
    val title: String? = null,
    val description: String? = null,
)

@Serializable
data class ItemResponse(
    val id: String,
    val title: String,
    val description: String?,
    val userId: String,
)

fun Route.userItemRoutes() {
    route("/users/me/items") {
        install(AuthPlugin)

        // GET /users/me/items
        get {
            val user  = call.attributes[UserAttribute]
            val items = transaction {
                Items.select { Items.userId eq user.id }
                    .orderBy(Items.id, SortOrder.DESC)
                    .map { row ->
                        ItemResponse(
                            id          = row[Items.id].value.toString(),
                            title       = row[Items.title],
                            description = row[Items.description],
                            userId      = row[Items.userId].toString(),
                        )
                    }
            }
            call.respond(items)
        }

        // POST /users/me/items
        post {
            val user = call.attributes[UserAttribute]
            val body = call.receive<ItemRequest>()

            if (body.title.isNullOrBlank()) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "title is required"))
                return@post
            }

            val item = transaction {
                val id = UUID.randomUUID()
                Items.insert {
                    it[Items.id]          = id
                    it[Items.title]       = body.title
                    it[Items.description] = body.description
                    it[Items.userId]      = user.id
                }
                ItemResponse(
                    id          = id.toString(),
                    title       = body.title,
                    description = body.description,
                    userId      = user.id.toString(),
                )
            }
            call.respond(HttpStatusCode.Created, item)
        }

        // GET /users/me/items/{id}
        get("/{id}") {
            val user   = call.attributes[UserAttribute]
            val itemId = call.parameters["id"]?.let { UUID.fromString(it) }
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid id"))

            val item = transaction {
                Items.select { (Items.id eq itemId) and (Items.userId eq user.id) }
                    .singleOrNull()
                    ?.let { row ->
                        ItemResponse(
                            id          = row[Items.id].value.toString(),
                            title       = row[Items.title],
                            description = row[Items.description],
                            userId      = row[Items.userId].toString(),
                        )
                    }
            }

            if (item == null) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Not found"))
            } else {
                call.respond(item)
            }
        }

        // PUT /users/me/items/{id}
        put("/{id}") {
            val user   = call.attributes[UserAttribute]
            val itemId = call.parameters["id"]?.let { UUID.fromString(it) }
                ?: return@put call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid id"))

            val body = call.receive<ItemRequest>()

            val updated = transaction {
                val count = Items.update({
                    (Items.id eq itemId) and (Items.userId eq user.id)
                }) {
                    if (body.title != null) it[Items.title] = body.title
                    it[Items.description] = body.description
                }

                if (count == 0) return@transaction null

                Items.select { (Items.id eq itemId) and (Items.userId eq user.id) }
                    .singleOrNull()
                    ?.let { row ->
                        ItemResponse(
                            id          = row[Items.id].value.toString(),
                            title       = row[Items.title],
                            description = row[Items.description],
                            userId      = row[Items.userId].toString(),
                        )
                    }
            }

            if (updated == null) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Not found"))
            } else {
                call.respond(updated)
            }
        }

        // DELETE /users/me/items/{id} → 204
        delete("/{id}") {
            val user   = call.attributes[UserAttribute]
            val itemId = call.parameters["id"]?.let { UUID.fromString(it) }
                ?: return@delete call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid id"))

            val count = transaction {
                Items.deleteWhere { (Items.id eq itemId) and (Items.userId eq user.id) }
            }

            if (count == 0) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Not found"))
            } else {
                call.respond(HttpStatusCode.NoContent)
            }
        }
    }
}
