package ca.yarova.grpc.security;

// gRPC server interceptor — validates JWT or API key from gRPC metadata.
//
// gRPC metadata is the equivalent of HTTP headers.
// Clients send: Metadata.Key.of("authorization", ASCII_STRING_MARSHALLER), "Bearer <token>"
//               Metadata.Key.of("x-api-key", ASCII_STRING_MARSHALLER), "<key>"
//
// On valid JWT: stores AuthenticatedUser in gRPC context, calls next.
// On valid API key: DB lookup, stores user in context, calls next.
// On missing or invalid credential: closes call with UNAUTHENTICATED status.

import ca.yarova.grpc.entity.User;
import ca.yarova.grpc.repository.UserRepository;
import io.grpc.*;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

import java.util.Optional;

public class AuthInterceptor implements ServerInterceptor {

    public static final Context.Key<AuthenticatedUser> USER_KEY =
            Context.key("authenticated_user");

    private static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);
    private static final Metadata.Key<String> API_KEY_HEADER =
            Metadata.Key.of("x-api-key", Metadata.ASCII_STRING_MARSHALLER);

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public AuthInterceptor(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String authHeader = headers.get(AUTHORIZATION_KEY);
        String apiKey = headers.get(API_KEY_HEADER);

        // --- Attempt 1: Bearer JWT ---
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = jwtUtil.validateToken(token);
                AuthenticatedUser user = new AuthenticatedUser(
                        java.util.UUID.fromString(claims.getSubject()),
                        claims.get("email", String.class),
                        claims.get("name", String.class));
                Context ctx = Context.current().withValue(USER_KEY, user);
                return Contexts.interceptCall(ctx, call, headers, next);
            } catch (JwtException | IllegalArgumentException ignored) {
                // Fall through to API key check
            }
        }

        // --- Attempt 2: X-API-Key ---
        if (apiKey != null && !apiKey.isBlank()) {
            Optional<User> userOpt = userRepository.findByApiKey(apiKey);
            if (userOpt.isPresent()) {
                User dbUser = userOpt.get();
                AuthenticatedUser user = new AuthenticatedUser(
                        dbUser.getId(), dbUser.getEmail(), dbUser.getName());
                Context ctx = Context.current().withValue(USER_KEY, user);
                return Contexts.interceptCall(ctx, call, headers, next);
            }
        }

        // --- No valid credentials ---
        call.close(
                Status.UNAUTHENTICATED.withDescription(
                        "Authentication required. Provide Bearer token or x-api-key metadata."),
                new Metadata());
        return new ServerCall.Listener<>() {};
    }
}
