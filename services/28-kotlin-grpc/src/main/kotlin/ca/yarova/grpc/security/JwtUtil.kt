package ca.yarova.grpc.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import java.nio.charset.StandardCharsets
import java.util.Date
import java.util.UUID

// JwtUtil — issues and validates JWT tokens for gRPC service auth.
//
// JWT secret: loaded from JWT_SECRET env var at construction.
// Expiry: 8 hours from issuance.
// Algorithm: HS256.

object JwtUtil {

    private const val EXPIRY_MS: Long = 8L * 60 * 60 * 1000 // 8 hours

    private val signingKey by lazy {
        val secret = System.getenv("JWT_SECRET")
            ?: throw IllegalStateException("JWT_SECRET environment variable is not set")
        val padded = if (secret.length < 32) secret.padEnd(32, '0') else secret
        Keys.hmacShaKeyFor(padded.toByteArray(StandardCharsets.UTF_8))
    }

    fun generateToken(userId: UUID, email: String, name: String): String {
        val now = Date()
        val expiry = Date(now.time + EXPIRY_MS)
        return Jwts.builder()
            .subject(userId.toString())
            .claim("email", email)
            .claim("name", name)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(signingKey)
            .compact()
    }

    fun validateToken(token: String): Claims =
        Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .payload
}
