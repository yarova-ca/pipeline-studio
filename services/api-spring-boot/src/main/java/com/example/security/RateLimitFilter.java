package com.example.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * Global rate limiter — 100 requests per minute (token bucket, process-wide).
 * Health endpoints are exempt so k8s probes are never blocked.
 * For per-IP limiting in production replace with a Redis-backed bucket.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private final Bucket bucket = Bucket.builder()
        .addLimit(Bandwidth.simple(100, Duration.ofMinutes(1)))
        .build();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Health and docs endpoints are exempt from rate limiting.
        if (path.startsWith("/health") || path.startsWith("/actuator") || path.startsWith("/docs")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests — try again in 60 seconds\"}");
        }
    }
}
