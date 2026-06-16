package com.example.controller;

import com.example.config.Compliance;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Reports the active industry profile and the controls in effect.
 * Switch with COMPLIANCE_PROFILE — the controls flip at boot, no rebuild.
 */
@RestController
public class ComplianceController {

    private final Compliance compliance;

    public ComplianceController(Compliance compliance) {
        this.compliance = compliance;
    }

    @GetMapping("/compliance")
    public Map<String, Object> current() {
        return Map.of(
                "profile", compliance.getProfile(),
                "controls", Map.of(
                        "auditLogging", compliance.isAuditLogging(),
                        "sessionTimeoutSeconds", compliance.getSessionTimeoutSeconds(),
                        "mfaRequired", compliance.isMfaRequired(),
                        "encryptionInTransit", compliance.isEncryptionInTransit()),
                "required", compliance.getRequired());
    }
}
