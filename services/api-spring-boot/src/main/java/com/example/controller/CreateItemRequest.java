package com.example.controller;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Request body for POST /users/me/items.
 *
 * I-17 / invariant I-6: unknown extra JSON fields must be rejected with 400.
 * Jackson ignores unknown fields by default; {@code @JsonIgnoreProperties(ignoreUnknown = false)}
 * forces an UnrecognizedPropertyException, which Spring maps to HTTP 400.
 */
@JsonIgnoreProperties(ignoreUnknown = false)
public class CreateItemRequest {

    private String title;
    private String description;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
