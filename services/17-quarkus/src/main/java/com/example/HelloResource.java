package com.example;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;

@Path("/")
public class HelloResource {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> hello() {
        return Map.of("message", "Hello from Quarkus 3.35", "framework", "17-quarkus", "version", "1.0.0");
    }

    @GET
    @Path("/health")
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> health() {
        return Map.of("status", "ok", "version", "1.0.0");
    }

    @GET @Path("/health/live") @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> liveness() { return Map.of("status", "ok"); }

    @GET @Path("/health/ready") @Produces(MediaType.APPLICATION_JSON)
    public Map<String, String> readiness() { return Map.of("status", "ok"); }
}
