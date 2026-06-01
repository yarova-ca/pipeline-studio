package com.example.service;

import com.example.entity.Item;
import com.example.entity.User;
import com.example.repository.ItemRepository;
import com.example.repository.UserRepository;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.exceptions.HttpStatusException;
import jakarta.inject.Singleton;

import java.util.List;
import java.util.UUID;

@Singleton
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;

    public ItemService(ItemRepository itemRepository, UserRepository userRepository) {
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
    }

    public List<Item> getItemsForUser(UUID userId) {
        return itemRepository.findByUserId(userId);
    }

    public Item createItem(UUID userId, String title, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new HttpStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Item item = new Item(title, description, user);
        return itemRepository.save(item);
    }

    public Item getItem(UUID userId, UUID itemId) {
        return itemRepository.findByIdAndUserId(itemId, userId)
                .orElseThrow(() -> new HttpStatusException(HttpStatus.NOT_FOUND, "Item not found"));
    }

    public Item updateItem(UUID userId, UUID itemId, String title, String description) {
        Item item = getItem(userId, itemId);
        if (title != null && !title.isBlank()) item.setTitle(title);
        if (description != null) item.setDescription(description);
        return itemRepository.update(item);
    }

    public void deleteItem(UUID userId, UUID itemId) {
        Item item = getItem(userId, itemId);
        itemRepository.delete(item);
    }
}
