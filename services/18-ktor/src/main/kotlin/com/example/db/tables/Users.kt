package com.example.db.tables

import org.jetbrains.exposed.dao.id.UUIDTable

object Users : UUIDTable("users") {
    val email    = varchar("email", 255).uniqueIndex()
    val name     = varchar("name", 255)
    val apiKey   = varchar("api_key", 128).nullable().uniqueIndex()
    val provider = varchar("provider", 50).default("local")
}
