package com.example.auth;

import io.smallrye.jwt.build.Jwt;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;

import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.UUID;

/**
 * Generates SmallRye JWT tokens for authenticated users.
 *
 * SmallRye JWT (quarkus-smallrye-jwt) handles verification automatically
 * via the `mp.jwt.verify.*` properties in application.properties.
 * This utility handles only token issuance.
 */
@ApplicationScoped
public class TokenUtil {

    /** 8-hour expiry — matches a standard workday session. */
    private static final long EXPIRY_SECS = 8L * 60 * 60;

    @ConfigProperty(name = "mp.jwt.verify.issuer", defaultValue = "pipeline-studio")
    String issuer;

    /**
     * Sign a JWT for the given user.
     *
     * @param userId user UUID
     * @param email  user email
     * @param name   display name
     * @return compact signed JWT
     */
    public String generateToken(UUID userId, String email, String name) {
        return Jwt.issuer(issuer)
                .subject(userId.toString())
                .claim("email", email)
                .claim("name", name)
                .issuedAt(Instant.now())
                .expiresIn(EXPIRY_SECS)
                .sign();
    }
}
