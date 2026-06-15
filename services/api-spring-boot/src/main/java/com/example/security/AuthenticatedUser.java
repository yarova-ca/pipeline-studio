package com.example.security;

import java.util.UUID;

/**
 * Principal stored in the SecurityContext after authentication.
 * Carries resolved user fields so controllers don't need to re-query the DB.
 */
public class AuthenticatedUser {

    private final UUID id;
    private final String email;
    private final String name;

    public AuthenticatedUser(UUID id, String email, String name) {
        this.id = id;
        this.email = email;
        this.name = name;
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getName() { return name; }
}
