package ca.yarova.graphql.security;

import java.util.UUID;

public record AuthenticatedUser(UUID id, String email, String name) {}
