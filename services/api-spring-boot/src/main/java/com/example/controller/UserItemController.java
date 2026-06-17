package com.example.controller;

import com.example.entity.Item;
import com.example.security.AuthenticatedUser;
import com.example.service.ItemService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/users/me/items")
public class UserItemController {

    private final ItemService itemService;

    public UserItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping
    public ResponseEntity<List<Item>> listItems(Authentication authentication) {
        UUID userId = principal(authentication).getId();
        return ResponseEntity.ok(itemService.getItemsForUser(userId));
    }

    @PostMapping
    public ResponseEntity<Item> createItem(
            @RequestBody CreateItemRequest body,
            Authentication authentication) {

        String title = body.getTitle();
        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "title is required");
        }

        UUID userId = principal(authentication).getId();
        Item item = itemService.createItem(userId, title, body.getDescription());
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> getItem(
            @PathVariable UUID id,
            Authentication authentication) {

        UUID userId = principal(authentication).getId();
        return ResponseEntity.ok(itemService.getItem(userId, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Item> updateItem(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        UUID userId = principal(authentication).getId();
        Item item = itemService.updateItem(userId, id, body.get("title"), body.get("description"));
        return ResponseEntity.ok(item);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable UUID id,
            Authentication authentication) {

        UUID userId = principal(authentication).getId();
        itemService.deleteItem(userId, id);
        return ResponseEntity.noContent().build();
    }

    private AuthenticatedUser principal(Authentication authentication) {
        return (AuthenticatedUser) authentication.getPrincipal();
    }
}
