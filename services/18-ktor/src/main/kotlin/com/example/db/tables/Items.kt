package com.example.db.tables

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.ReferenceOption

object Items : UUIDTable("items") {
    val title       = varchar("title", 255)
    val description = text("description").nullable()
    val userId      = uuid("user_id").references(Users.id, onDelete = ReferenceOption.CASCADE)
}
