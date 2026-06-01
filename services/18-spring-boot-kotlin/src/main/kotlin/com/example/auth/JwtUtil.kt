package com.example.auth

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.nio.charset.StandardCharsets
import java.util.Date
import java.util.UUID
import javax.crypto.SecretKey

/** JWT signing and verification — HS256, 8-hour expiry. */
@Component
class JwtUtil(@Value("\${app.jwt.secret}") secret: String) {

    companion object {
        private const val EXPIRY_MS = 8L * 60 * 60 * 1000 // 8 hours
    }

    private val signingKey: SecretKey = run {
        val padded = if (secret.length < 32) secret + "0".repeat(32 - secret.length) else secret
        Keys.hmacShaKeyFor(padded.toByteArray(StandardCharsets.UTF_8))
    }

    fun generateToken(userId: UUID, email: String, name: String): String {
        val now = Date()
        return Jwts.builder()
            .subject(userId.toString())
            .claim("email", email)
            .claim("name", name)
            .issuedAt(now)
            .expiration(Date(now.time + EXPIRY_MS))
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
