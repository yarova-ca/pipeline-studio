package com.example.service

import com.example.entity.Item
import com.example.repository.ItemRepository
import com.example.repository.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class ItemService(
    private val itemRepository: ItemRepository,
    private val userRepository: UserRepository,
) {

    fun getItemsForUser(userId: UUID): List<Item> =
        itemRepository.findByUserId(userId)

    fun createItem(userId: UUID, title: String, description: String?): Item {
        val user = userRepository.findById(userId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "User not found") }
        return itemRepository.save(Item(title = title, description = description, user = user))
    }

    fun getItem(userId: UUID, itemId: UUID): Item =
        itemRepository.findByIdAndUserId(itemId, userId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found")

    fun updateItem(userId: UUID, itemId: UUID, title: String?, description: String?): Item {
        val item = getItem(userId, itemId)
        if (!title.isNullOrBlank()) item.title = title
        if (description != null) item.description = description
        return itemRepository.save(item)
    }

    fun deleteItem(userId: UUID, itemId: UUID) {
        val item = getItem(userId, itemId)
        itemRepository.delete(item)
    }
}
