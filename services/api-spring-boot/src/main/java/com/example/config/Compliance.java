package com.example.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Industry compliance profile, read at startup from compliance/profiles.json.
 * One repo serves every industry; COMPLIANCE_PROFILE flips a whole catalog of controls.
 */
@Component
public class Compliance {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private String profile = "baseline";
    private String name = "";
    private String jurisdiction = "";
    private final Map<String, Object> controls = new LinkedHashMap<>();

    @PostConstruct
    public void init() {
        String p = System.getenv().getOrDefault("COMPLIANCE_PROFILE", "baseline");
        try {
            load(p);
        } catch (Exception e) {
            // A compliance profile that cannot be loaded must fail loud.
            System.err.println("FATAL: compliance profiles not loadable: " + p + ": " + e.getMessage());
            System.exit(1);
        }
    }

    /**
     * Loads the named profile from compliance/profiles.json into this bean.
     * Throws IllegalArgumentException when the profile is not present in the catalog.
     */
    void load(String p) throws Exception {
        JsonNode root = MAPPER.readTree(readProfilesJson());
        JsonNode selected = root.path("profiles").path(p);
        if (selected.isMissingNode()) {
            throw new IllegalArgumentException("unknown COMPLIANCE_PROFILE: " + p);
        }
        this.profile = p;
        this.name = selected.path("name").asText("");
        this.jurisdiction = selected.path("jurisdiction").asText("");
        this.controls.clear();
        selected.path("controls").fields()
                .forEachRemaining(e -> controls.put(e.getKey(), unwrap(e.getValue())));
    }

    private byte[] readProfilesJson() throws Exception {
        // Prefer the working-dir file; fall back to the classpath copy.
        Path onDisk = Path.of("compliance", "profiles.json");
        if (Files.isReadable(onDisk)) {
            return Files.readAllBytes(onDisk);
        }
        try (InputStream in = getClass().getClassLoader().getResourceAsStream("compliance/profiles.json")) {
            if (in == null) {
                throw new IllegalStateException("compliance/profiles.json not found on disk or classpath");
            }
            return in.readAllBytes();
        }
    }

    private static Object unwrap(JsonNode v) {
        if (v.isBoolean()) {
            return v.asBoolean();
        }
        if (v.isNumber()) {
            return v.numberValue();
        }
        return v.asText();
    }

    public String getProfile() { return profile; }

    public String getName() { return name; }

    public String getJurisdiction() { return jurisdiction; }

    public Map<String, Object> getControls() { return controls; }

    /**
     * Idle session timeout in seconds, read from the active profile.
     * Used by JwtUtil to set token expiry. Defaults to 8 hours when absent.
     */
    public long getSessionTimeoutSeconds() {
        Object v = controls.get("session_timeout_seconds");
        if (v instanceof Number n) {
            return n.longValue();
        }
        return 8L * 60 * 60;
    }
}
