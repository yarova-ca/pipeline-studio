package com.example.auth

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.exceptions.JWTVerificationException
import java.util.Date

data class JWTClaims(
    val userId: String,
    val email: String,
    val name: String,
)

object JwtService {

    private val secret: String
        get() = System.getenv("JWT_SECRET") ?: "dev-secret-change-in-prod"

    private val algorithm: Algorithm
        get() = Algorithm.HMAC256(secret)

    fun signToken(userId: String, email: String, name: String): String {
        val now        = System.currentTimeMillis()
        // Session length is set by the active industry profile (HIPAA → 15 min).
        val expiryMs   = com.example.Compliance.sessionTimeoutSeconds * 1000

        return JWT.create()
            .withIssuer("pipeline-studio")
            .withSubject(userId)
            .withClaim("email", email)
            .withClaim("name", name)
            .withIssuedAt(Date(now))
            .withExpiresAt(Date(now + expiryMs))
            .sign(algorithm)
    }

    fun verifyToken(token: String): JWTClaims? {
        return try {
            val verifier = JWT.require(algorithm)
                .withIssuer("pipeline-studio")
                .build()

            val decoded = verifier.verify(token)

            JWTClaims(
                userId = decoded.subject,
                email  = decoded.getClaim("email").asString(),
                name   = decoded.getClaim("name").asString(),
            )
        } catch (e: JWTVerificationException) {
            null
        }
    }
}
