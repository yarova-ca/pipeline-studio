package com.example.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

/**
 * I-1: the service refuses to boot on missing or weak config.
 * A JWT secret shorter than 32 characters terminates the process with a
 * non-zero exit code rather than running insecure.
 */
@Component
public class StartupConfigValidator implements ApplicationListener<ApplicationReadyEvent> {

    private final String jwtSecret;

    public StartupConfigValidator(@Value("${app.jwt.secret:}") String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        if (jwtSecret == null || jwtSecret.length() < 32) {
            System.err.println("FATAL: JWT_SECRET must be set and at least 32 characters");
            System.exit(1);
        }
    }
}
