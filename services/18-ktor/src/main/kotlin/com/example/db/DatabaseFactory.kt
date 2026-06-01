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
        val databaseUrl = System.getenv("DATABASE_URL")
            ?: "jdbc:h2:mem:test;DB_CLOSE_DELAY=-1"

        val config = HikariConfig().apply {
            jdbcUrl = databaseUrl
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
