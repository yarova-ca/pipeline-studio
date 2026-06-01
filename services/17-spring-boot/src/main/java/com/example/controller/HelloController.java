package com.example.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HelloController {

    @GetMapping("/")
    public Map<String, String> hello() {
        return Map.of("message", "Hello from Spring Boot 3.4", "framework", "17-spring-boot", "version", "1.0.0");
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "version", "1.0.0");
    }

    @GetMapping("/health/live")
    public Map<String, String> liveness() {
        return Map.of("status", "ok");
    }

    @GetMapping("/health/ready")
    public Map<String, String> readiness() {
        return Map.of("status", "ok");
    }
}
