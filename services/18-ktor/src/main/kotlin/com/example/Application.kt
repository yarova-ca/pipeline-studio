package com.example

import com.example.db.DatabaseFactory
import com.example.routes.authRoutes
import com.example.routes.userItemRoutes
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class HelloResponse(val message: String, val framework: String, val version: String)

@Serializable
data class HealthResponse(val status: String, val version: String? = null)

fun Application.module() {
    install(ContentNegotiation) {
        json()
    }

    DatabaseFactory.init()

    routing {
        get("/") {
            call.respond(HelloResponse("Hello from Ktor 3.5", "18-ktor", "1.0.0"))
        }
        get("/health") {
            call.respond(HealthResponse("ok", "1.0.0"))
        }
        get("/health/live") {
            call.respond(HealthResponse("ok"))
        }
        get("/health/ready") {
            call.respond(HealthResponse("ok"))
        }

        authRoutes()
        userItemRoutes()
    }
}

fun main() {
    val port = System.getenv("SERVER_PORT")?.toInt() ?: 8080
    embeddedServer(Netty, port = port, module = Application::module).start(wait = true)
}
