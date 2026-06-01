package com.example.entity;

import io.micronaut.data.annotation.GeneratedValue;
import io.micronaut.data.annotation.Id;
import io.micronaut.data.annotation.MappedEntity;
import io.micronaut.data.annotation.sql.JoinColumn;

import java.time.Instant;
import java.util.UUID;

@MappedEntity("users")
public class User {

    @Id
    @GeneratedValue(GeneratedValue.Type.UUID)
    private UUID id;

    private String email;
    private String name;
    private String apiKey;
    private String provider;
    private Instant createdAt;
    private Instant updatedAt;

    public User() {}

    public User(String email, String name, String provider) {
        this.email = email;
        this.name = name;
        this.provider = provider;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
