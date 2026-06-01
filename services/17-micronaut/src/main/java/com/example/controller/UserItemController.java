package com.example.controller;

import com.example.entity.Item;
import com.example.service.ItemService;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.HttpStatus;
import io.micronaut.http.annotation.*;
import io.micronaut.http.exceptions.HttpStatusException;
import io.micronaut.security.annotation.Secured;
import io.micronaut.security.authentication.Authentication;
import io.micronaut.security.rules.SecurityRule;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Controller("/users/me/items")
@Secured(SecurityRule.IS_AUTHENTICATED)
public class UserItemController {

    private final ItemService itemService;

    public UserItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @Get
    public HttpResponse<List<Item>> listItems(Authentication authentication) {
        UUID userId = userId(authentication);
        return HttpResponse.ok(itemService.getItemsForUser(userId));
    }

    @Post
    public HttpResponse<Item> createItem(@Body Map<String, String> body, Authentication authentication) {
        String title = body.get("title");
        if (title == null || title.isBlank()) {
            throw new HttpStatusException(HttpStatus.BAD_REQUEST, "title is required");
        }
        UUID userId = userId(authentication);
        Item item = itemService.createItem(userId, title, body.get("description"));
        return HttpResponse.created(item);
    }

    @Get("/{id}")
    public HttpResponse<Item> getItem(@PathVariable UUID id, Authentication authentication) {
        return HttpResponse.ok(itemService.getItem(userId(authentication), id));
    }

    @Put("/{id}")
    public HttpResponse<Item> updateItem(
            @PathVariable UUID id,
            @Body Map<String, String> body,
            Authentication authentication) {
        Item item = itemService.updateItem(userId(authentication), id,
                body.get("title"), body.get("description"));
        return HttpResponse.ok(item);
    }

    @Delete("/{id}")
    public HttpResponse<Void> deleteItem(@PathVariable UUID id, Authentication authentication) {
        itemService.deleteItem(userId(authentication), id);
        return HttpResponse.noContent();
    }

    private UUID userId(Authentication auth) {
        return UUID.fromString((String) auth.getAttributes().get("sub"));
    }
}
