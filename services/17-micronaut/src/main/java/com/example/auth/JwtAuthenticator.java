package com.example.auth;

import io.micronaut.context.annotation.Value;
import io.micronaut.security.authentication.Authentication;
import io.micronaut.security.token.jwt.validator.JwtTokenValidator;
import jakarta.inject.Singleton;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

/**
 * Low-level JWT utility: signs and verifies HS256 tokens.
 *
 * Micronaut Security (micronaut-security) handles request-level auth via
 * {@link io.micronaut.security.token.jwt.validator.JwtTokenValidator}.
 * This class is used directly only in AuthController to issue tokens.
 */
@Singleton
public class JwtAuthenticator {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticator.class);

    /** 8-hour expiry — matches a standard workday session. */
    private static final long EXPIRY_SECS = 8L * 60 * 60;

    private final String secret;

    public JwtAuthenticator(@Value("${app.jwt.secret}") String secret) {
        this.secret = secret.length() < 32
                ? secret + "0".repeat(32 - secret.length())
                : secret;
    }

    /**
     * Issue a signed JWT for the given user.
     *
     * @param userId user UUID
     * @param email  user email
     * @param name   display name
     * @return compact JWT string
     */
    public String generateToken(UUID userId, String email, String name) {
        long now = Instant.now().getEpochSecond();
        String header = base64Url("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
        String payload = base64Url(
                "{\"sub\":\"" + userId + "\",\"email\":\"" + email + "\",\"name\":\""
                        + name + "\",\"iat\":" + now + ",\"exp\":" + (now + EXPIRY_SECS) + "}");
        String sig = sign(header + "." + payload);
        return header + "." + payload + "." + sig;
    }

    /**
     * Verify and decode a JWT.
     *
     * @param token the compact JWT
     * @return decoded claims map, or null if invalid/expired
     */
    public Map<String, Object> verifyToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;
            String expectedSig = sign(parts[0] + "." + parts[1]);
            if (!constantTimeEquals(expectedSig, parts[2])) return null;

            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]));
            long exp = Long.parseLong(payloadJson.replaceAll(".*\"exp\":(\\d+).*", "$1"));
            if (Instant.now().getEpochSecond() > exp) return null;

            String sub = payloadJson.replaceAll(".*\"sub\":\"([^\"]+)\".*", "$1");
            String email = payloadJson.replaceAll(".*\"email\":\"([^\"]+)\".*", "$1");
            String name = payloadJson.replaceAll(".*\"name\":\"([^\"]+)\".*", "$1");
            return Map.of("sub", sub, "email", email, "name", name);
        } catch (Exception e) {
            log.debug("JWT verification failed", e);
            return null;
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private String base64Url(String input) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(input.getBytes(StandardCharsets.UTF_8));
    }

    private String sign(String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(input.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException("JWT signing failed", e);
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int diff = 0;
        for (int i = 0; i < a.length(); i++) {
            diff |= a.charAt(i) ^ b.charAt(i);
        }
        return diff == 0;
    }
}
