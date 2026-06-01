package ca.yarova.grpc.security

// gRPC server interceptor — validates JWT or API key from gRPC metadata.
//
// gRPC metadata is the equivalent of HTTP headers.
// Clients send: Metadata.Key.of("authorization", ASCII_STRING_MARSHALLER) -> "Bearer <token>"
//               Metadata.Key.of("x-api-key", ASCII_STRING_MARSHALLER) -> "<key>"
//
// On valid JWT: stores AuthenticatedUser in gRPC context, calls next.
// On missing or invalid credential: closes call with UNAUTHENTICATED.

import io.grpc.*
import io.jsonwebtoken.JwtException
import java.util.UUID

data class AuthenticatedUser(val id: UUID, val email: String, val name: String)

class AuthInterceptor : ServerInterceptor {

    companion object {
        val USER_KEY: Context.Key<AuthenticatedUser> = Context.key("authenticated_user")

        private val AUTHORIZATION_KEY =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER)
        private val API_KEY_HEADER =
            Metadata.Key.of("x-api-key", Metadata.ASCII_STRING_MARSHALLER)
    }

    override fun <ReqT, RespT> interceptCall(
        call: ServerCall<ReqT, RespT>,
        headers: Metadata,
        next: ServerCallHandler<ReqT, RespT>
    ): ServerCall.Listener<ReqT> {

        val authHeader = headers.get(AUTHORIZATION_KEY)
        val apiKey = headers.get(API_KEY_HEADER)

        // --- Attempt 1: Bearer JWT ---
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            val token = authHeader.removePrefix("Bearer ")
            return try {
                val claims = JwtUtil.validateToken(token)
                val userId = UUID.fromString(claims.subject)
                val email = claims.get("email", String::class.java)
                val name = claims.get("name", String::class.java)
                val user = AuthenticatedUser(userId, email, name)
                val ctx = Context.current().withValue(USER_KEY, user)
                Contexts.interceptCall(ctx, call, headers, next)
            } catch (e: JwtException) {
                call.close(
                    Status.UNAUTHENTICATED.withDescription("Invalid or expired JWT token"),
                    Metadata()
                )
                object : ServerCall.Listener<ReqT>() {}
            }
        }

        // --- Attempt 2: X-API-Key ---
        // API key DB lookup is synchronous via JPA — handled by passing through.
        // Actual DB validation is done in the service handler using the key from context.
        if (!apiKey.isNullOrBlank()) {
            val ctx = Context.current().withValue(
                Context.key("x-api-key"), apiKey
            )
            return Contexts.interceptCall(ctx, call, headers, next)
        }

        // --- No valid credentials ---
        call.close(
            Status.UNAUTHENTICATED.withDescription(
                "Authentication required. Provide Bearer token or x-api-key metadata."
            ),
            Metadata()
        )
        return object : ServerCall.Listener<ReqT>() {}
    }
}
