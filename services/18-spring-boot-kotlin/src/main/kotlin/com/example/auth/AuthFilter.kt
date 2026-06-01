package com.example.auth

import com.example.repository.UserRepository
import io.jsonwebtoken.JwtException
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

/**
 * Resolves auth from:
 * 1. Authorization: Bearer <JWT>
 * 2. X-API-Key header → DB lookup
 */
class AuthFilter(
    private val jwtUtil: JwtUtil,
    private val userRepository: UserRepository,
) : OncePerRequestFilter() {

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        chain: FilterChain,
    ) {
        val authorization = request.getHeader("Authorization")
        val apiKeyHeader = request.getHeader("X-API-Key")

        // Attempt 1: Bearer JWT.
        if (authorization?.startsWith("Bearer ") == true) {
            val token = authorization.removePrefix("Bearer ")
            try {
                val claims = jwtUtil.validateToken(token)
                val principal = AuthenticatedUser(
                    id = UUID.fromString(claims.subject),
                    email = claims["email", String::class.java],
                    name = claims["name", String::class.java],
                )
                val auth = UsernamePasswordAuthenticationToken(
                    principal, null,
                    listOf(SimpleGrantedAuthority("ROLE_USER")),
                )
                SecurityContextHolder.getContext().authentication = auth
                chain.doFilter(request, response)
                return
            } catch (_: JwtException) {
                // Fall through to API key check.
            } catch (_: IllegalArgumentException) {
                // Fall through.
            }
        }

        // Attempt 2: X-API-Key header.
        if (!apiKeyHeader.isNullOrBlank()) {
            val user = userRepository.findByApiKey(apiKeyHeader)
            if (user != null) {
                val principal = AuthenticatedUser(user.id, user.email, user.name)
                val auth = UsernamePasswordAuthenticationToken(
                    principal, null,
                    listOf(SimpleGrantedAuthority("ROLE_USER")),
                )
                SecurityContextHolder.getContext().authentication = auth
                chain.doFilter(request, response)
                return
            }
        }

        chain.doFilter(request, response)
    }
}
