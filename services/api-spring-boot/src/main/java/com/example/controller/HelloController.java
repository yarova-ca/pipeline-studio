package com.example.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Tag(name = "health", description = "Health check endpoints")
public class HelloController {

    private static final Logger log = LoggerFactory.getLogger(HelloController.class);

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping("/")
    @Operation(summary = "Hello endpoint")
    public Map<String, String> hello() {
        return Map.of("message", "Hello from Spring Boot 3.4", "framework", "17-spring-boot", "version", "1.0.0");
    }

    @GetMapping("/health")
    @Operation(summary = "Liveness check")
    public Map<String, String> health() {
        return Map.of("status", "ok", "version", "1.0.0");
    }

    @GetMapping("/health/live")
    @Operation(summary = "Kubernetes liveness probe")
    public Map<String, String> liveness() {
        return Map.of("status", "ok");
    }

    /**
     * DB-checking readiness probe.
     * Returns 503 when the database is unreachable so k8s removes the pod
     * from the load balancer until the connection recovers.
     */
    @GetMapping("/health/ready")
    @Operation(summary = "Kubernetes readiness probe — checks DB connectivity")
    public ResponseEntity<Map<String, String>> readiness() {
        try {
            entityManager.createNativeQuery("SELECT 1").getSingleResult();
            return ResponseEntity.ok(Map.of("status", "ok", "db", "connected"));
        } catch (Exception e) {
            log.error("health/ready db check failed", e);
            return ResponseEntity.status(503)
                .body(Map.of("status", "error", "db", "disconnected"));
        }
    }
}
