package com.example.db

import com.example.db.tables.Items
import com.example.db.tables.Users
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {

    fun init() {
        // No DATABASE_URL → in-memory H2 in PostgreSQL-compatibility mode.
        // MODE=PostgreSQL makes H2 match the Postgres production dialect, so the
        // Exposed DDL/DML that runs against Postgres also runs unchanged here.
        // A random database name per init isolates each test: every testApplication
        // boot gets a fresh empty schema, so re-seeding the same row never collides.
        val databaseUrl = System.getenv("DATABASE_URL")
            ?: "jdbc:h2:mem:test_${java.util.UUID.randomUUID()};MODE=PostgreSQL;DB_CLOSE_DELAY=-1"

        val config = HikariConfig().apply {
            jdbcUrl = databaseUrl
            // Credentials come from the environment, never the URL or source.
            System.getenv("DATABASE_USERNAME")?.let { username = it }
            System.getenv("DATABASE_PASSWORD")?.let { password = it }
            maximumPoolSize = 10
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_REPEATABLE_READ"
            validate()
        }

        val dataSource = HikariDataSource(config)
        Database.connect(dataSource)

        transaction {
            SchemaUtils.create(Users, Items)
        }
    }
}
