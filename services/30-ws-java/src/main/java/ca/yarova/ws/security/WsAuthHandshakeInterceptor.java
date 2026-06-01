package ca.yarova.ws.security;

// WebSocket handshake interceptor — validates JWT or API key during the HTTP upgrade.
//
// Spring WebSocket calls beforeHandshake before upgrading the connection.
// Auth is validated here so unauthenticated connections never establish.
//
// Resolution order:
//   1. Authorization: Bearer <JWT> header — verified via JwtUtil.
//   2. ?token=<JWT> query parameter — for browser WebSocket clients.
//
// On valid auth: stores AuthenticatedUser in attributes map, returns true.
// On missing or invalid auth: returns false, closes the connection with 401.

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;
import java.util.UUID;

public class WsAuthHandshakeInterceptor implements HandshakeInterceptor {

    public static final String USER_ATTRIBUTE = "authenticated_user";

    private final JwtUtil jwtUtil;

    public WsAuthHandshakeInterceptor(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return false;
        }

        HttpServletRequest httpRequest = servletRequest.getServletRequest();

        // --- Attempt 1: Authorization header ---
        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = jwtUtil.validateToken(token);
                UUID userId = UUID.fromString(claims.getSubject());
                String email = claims.get("email", String.class);
                String name = claims.get("name", String.class);
                attributes.put(USER_ATTRIBUTE, new AuthenticatedUser(userId, email, name));
                return true;
            } catch (JwtException | IllegalArgumentException ignored) {
                // Fall through to query param check
            }
        }

        // --- Attempt 2: ?token= query parameter (browser WebSocket clients) ---
        String tokenParam = httpRequest.getParameter("token");
        if (tokenParam != null && !tokenParam.isBlank()) {
            try {
                Claims claims = jwtUtil.validateToken(tokenParam);
                UUID userId = UUID.fromString(claims.getSubject());
                String email = claims.get("email", String.class);
                String name = claims.get("name", String.class);
                attributes.put(USER_ATTRIBUTE, new AuthenticatedUser(userId, email, name));
                return true;
            } catch (JwtException | IllegalArgumentException ignored) {
                // Fall through
            }
        }

        // --- No valid credentials ---
        response.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
        return false;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // No-op
    }
}
