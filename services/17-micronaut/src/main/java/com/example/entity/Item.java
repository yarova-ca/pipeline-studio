package com.example.entity;

import io.micronaut.data.annotation.GeneratedValue;
import io.micronaut.data.annotation.Id;
import io.micronaut.data.annotation.MappedEntity;
import io.micronaut.data.annotation.Relation;

import java.time.Instant;
import java.util.UUID;

@MappedEntity("items")
public class Item {

    @Id
    @GeneratedValue(GeneratedValue.Type.UUID)
    private UUID id;

    private String title;
    private String description;

    @Relation(Relation.Kind.MANY_TO_ONE)
    private User user;

    private Instant createdAt;
    private Instant updatedAt;

    public Item() {}

    public Item(String title, String description, User user) {
        this.title = title;
        this.description = description;
        this.user = user;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
