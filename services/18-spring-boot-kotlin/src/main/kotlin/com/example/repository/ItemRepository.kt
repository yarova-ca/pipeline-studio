package com.example.repository

import com.example.entity.Item
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface ItemRepository : JpaRepository<Item, UUID> {
    fun findByUserId(userId: UUID): List<Item>
    fun findByIdAndUserId(id: UUID, userId: UUID): Item?
}
