package com.example.db.tables

import org.jetbrains.exposed.dao.id.UUIDTable
import org.jetbrains.exposed.sql.ReferenceOption

object Items : UUIDTable("items") {
    val title       = varchar("title", 255)
    val description = text("description").nullable()
    // FK to Users.id. reference() makes the static type Column<EntityID<UUID>>,
    // so the typed DSL binds the value via setWithEntityIdValue on INSERT.
    // The plain uuid("user_id").references(...) form keeps the static type as
    // Column<UUID> while the runtime columnType is EntityID-wrapped — that
    // mismatch made INSERT render "ITEMS.USER_ID" instead of the bound value.
    val userId      = reference("user_id", Users, onDelete = ReferenceOption.CASCADE)
}
