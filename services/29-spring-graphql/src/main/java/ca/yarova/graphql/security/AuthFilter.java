package ca.yarova.graphql.security;

// Spring GraphQL auth filter — validates JWT or API key on every HTTP request.
//
// Spring GraphQL uses standard HTTP, so the same OncePerRequestFilter pattern applies.
// GraphQL resolvers access the authenticated user via SecurityContextHolder.
//
// Resolution order:
//   1. Authorization: Bearer <JWT> header — verified via JwtUtil.
//   2. X-API-Key header — DB lookup via UserRepository.
//
// On valid auth: sets authentication in SecurityContextHolder, calls filterChain.
// On missing auth: calls filterChain unauthenticated.
//   Protected resolvers are secured via @SchemaMapping + @PreAuthorize or manual checks.

import ca.yarova.graphql.entity.User;
import ca.yarova.graphql.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class AuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public AuthFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authorization = request.getHeader("Authorization");
        String apiKeyHeader = request.getHeader("X-API-Key");

        // --- Attempt 1: Bearer JWT ---
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);
            try {
                Claims claims = jwtUtil.validateToken(token);
                UUID userId = UUID.fromString(claims.getSubject());
                String email = claims.get("email", String.class);
                String name = claims.get("name", String.class);

                AuthenticatedUser principal = new AuthenticatedUser(userId, email, name);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                principal, null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER")));
                SecurityContextHolder.getContext().setAuthentication(auth);
                filterChain.doFilter(request, response);
                return;
            } catch (JwtException | IllegalArgumentException ignored) {
                // Fall through to API key check
            }
        }

        // --- Attempt 2: X-API-Key ---
        if (apiKeyHeader != null && !apiKeyHeader.isBlank()) {
            Optional<User> userOpt = userRepository.findByApiKey(apiKeyHeader);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                AuthenticatedUser principal =
                        new AuthenticatedUser(user.getId(), user.getEmail(), user.getName());
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                principal, null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER")));
                SecurityContextHolder.getContext().setAuthentication(auth);
                filterChain.doFilter(request, response);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
