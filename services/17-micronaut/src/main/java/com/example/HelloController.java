package com.example;

import io.micronaut.http.annotation.*;
import java.util.Map;

@Controller
public class HelloController {

    @Get("/")
    public Map<String, String> hello() {
        return Map.of("message", "Hello from Micronaut 5.0", "framework", "17-micronaut", "version", "1.0.0");
    }

    @Get("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "version", "1.0.0");
    }

    @Get("/health/live")
    public Map<String, String> liveness() { return Map.of("status", "ok"); }

    @Get("/health/ready")
    public Map<String, String> readiness() { return Map.of("status", "ok"); }
}
