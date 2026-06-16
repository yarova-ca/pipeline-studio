package com.example.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Industry compliance profile, read at startup.
 * One repo serves every industry; COMPLIANCE_PROFILE flips a few controls.
 */
@Component
public class Compliance {

    private static final Set<String> VALID =
            Set.of("baseline", "hipaa", "pci", "fedramp", "fips", "pipeda");

    private String profile = "baseline";
    private boolean auditLogging = false;
    private long sessionTimeoutSeconds = 8L * 60 * 60;
    private boolean mfaRequired = false;
    private boolean encryptionInTransit = false;
    private final Map<String, String> required = new LinkedHashMap<>();

    @PostConstruct
    public void init() {
        String p = System.getenv().getOrDefault("COMPLIANCE_PROFILE", "baseline").toLowerCase();
        if (!VALID.contains(p)) {
            System.err.println("FATAL: unknown COMPLIANCE_PROFILE: " + p);
            System.exit(1);
        }
        this.profile = p;
        if (p.equals("baseline")) {
            return;
        }
        try {
            List<String> lines = Files.readAllLines(Path.of("compliance", p + ".yaml"));
            boolean inBlock = false;
            for (String line : lines) {
                if (line.startsWith("required_controls:")) {
                    inBlock = true;
                    continue;
                }
                if (!inBlock) {
                    continue;
                }
                String t = line.strip();
                if (t.startsWith("- ")) {
                    String[] kv = t.substring(2).split(":", 2);
                    if (kv.length == 2) {
                        String key = kv[0].strip();
                        String val = kv[1].split("#", 2)[0].strip().replaceAll("^[\"']|[\"']$", "");
                        required.put(key, val);
                        switch (key) {
                            case "audit_logging" -> auditLogging = "true".equals(val);
                            case "mfa_required" -> mfaRequired = "true".equals(val);
                            case "encryption_in_transit" -> encryptionInTransit = "true".equals(val);
                            case "session_timeout" -> {
                                try {
                                    sessionTimeoutSeconds = Long.parseLong(val);
                                } catch (NumberFormatException ignored) {
                                    // keep default
                                }
                            }
                            default -> { }
                        }
                    }
                } else if (!line.isEmpty() && !Character.isWhitespace(line.charAt(0))) {
                    break;
                }
            }
        } catch (Exception e) {
            // A named profile with no readable file must fail loud.
            System.err.println("FATAL: compliance profile not loadable: " + p + ": " + e.getMessage());
            System.exit(1);
        }
    }

    public String getProfile() { return profile; }
    public boolean isAuditLogging() { return auditLogging; }
    public long getSessionTimeoutSeconds() { return sessionTimeoutSeconds; }
    public boolean isMfaRequired() { return mfaRequired; }
    public boolean isEncryptionInTransit() { return encryptionInTransit; }
    public Map<String, String> getRequired() { return required; }
}
