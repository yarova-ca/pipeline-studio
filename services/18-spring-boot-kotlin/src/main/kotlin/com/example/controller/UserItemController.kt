package com.example.controller

import com.example.auth.AuthenticatedUser
import com.example.entity.Item
import com.example.service.ItemService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@RestController
@RequestMapping("/users/me/items")
class UserItemController(private val itemService: ItemService) {

    @GetMapping
    fun listItems(authentication: Authentication): ResponseEntity<List<Item>> =
        ResponseEntity.ok(itemService.getItemsForUser(principal(authentication).id))

    @PostMapping
    fun createItem(
        @RequestBody body: Map<String, String>,
        authentication: Authentication,
    ): ResponseEntity<Item> {
        val title = body["title"]?.takeIf { it.isNotBlank() }
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required")
        val item = itemService.createItem(principal(authentication).id, title, body["description"])
        return ResponseEntity.status(HttpStatus.CREATED).body(item)
    }

    @GetMapping("/{id}")
    fun getItem(@PathVariable id: UUID, authentication: Authentication): ResponseEntity<Item> =
        ResponseEntity.ok(itemService.getItem(principal(authentication).id, id))

    @PutMapping("/{id}")
    fun updateItem(
        @PathVariable id: UUID,
        @RequestBody body: Map<String, String>,
        authentication: Authentication,
    ): ResponseEntity<Item> =
        ResponseEntity.ok(
            itemService.updateItem(principal(authentication).id, id, body["title"], body["description"]),
        )

    @DeleteMapping("/{id}")
    fun deleteItem(@PathVariable id: UUID, authentication: Authentication): ResponseEntity<Void> {
        itemService.deleteItem(principal(authentication).id, id)
        return ResponseEntity.noContent().build()
    }

    private fun principal(auth: Authentication) = auth.principal as AuthenticatedUser
}
