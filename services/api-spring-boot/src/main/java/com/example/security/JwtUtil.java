package com.example.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    private final SecretKey signingKey;
    private final com.example.config.Compliance compliance;

    public JwtUtil(@Value("${app.jwt.secret}") String secret, com.example.config.Compliance compliance) {
        this.compliance = compliance;
        // Pad secret to at least 256 bits for HS256
        String padded = secret.length() < 32
                ? secret + "0".repeat(32 - secret.length())
                : secret;
        this.signingKey = Keys.hmacShaKeyFor(padded.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UUID userId, String email, String name) {
        Date now = new Date();
        long timeoutSeconds = compliance.getSessionTimeoutSeconds();

        var builder = Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("name", name)
                .issuedAt(now);

        // Session length is set by the active industry profile (HIPAA → 15 min).
        // A timeout of 0 means "off" (see control label) — issue a token with no
        // expiry rather than one that is already expired at creation time.
        if (timeoutSeconds > 0) {
            builder.expiration(new Date(now.getTime() + timeoutSeconds * 1000));
        }

        return builder.signWith(signingKey).compact();
    }

    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
