package com.example.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.Set;
import java.util.TreeSet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies the compliance catalog and the loader that flips the active profile.
 */
class ComplianceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private JsonNode profiles() throws Exception {
        JsonNode root = MAPPER.readTree(Files.readAllBytes(Path.of("compliance", "profiles.json")));
        JsonNode profiles = root.path("profiles");
        assertTrue(profiles.isObject(), "profiles.json must contain a profiles object");
        assertTrue(profiles.size() > 0, "catalog must contain at least one profile");
        return profiles;
    }

    private Set<String> controlKeys(JsonNode profile) {
        Set<String> keys = new TreeSet<>();
        profile.path("controls").fieldNames().forEachRemaining(keys::add);
        return keys;
    }

    @Test
    void everyProfileHasIdenticalControlKeys() throws Exception {
        JsonNode profiles = profiles();

        Iterator<String> names = profiles.fieldNames();
        String firstName = names.next();
        Set<String> expected = controlKeys(profiles.path(firstName));
        assertFalse(expected.isEmpty(), "first profile must declare control keys");

        while (names.hasNext()) {
            String name = names.next();
            Set<String> actual = controlKeys(profiles.path(name));
            assertEquals(expected, actual,
                    "profile '" + name + "' control keys differ from '" + firstName + "'");
        }
    }

    @Test
    void itsg33RequiresCanadianResidencyAndFipsCrypto() throws Exception {
        JsonNode controls = profiles().path("itsg-33").path("controls");
        assertEquals("canada", controls.path("data_residency").asText(),
                "itsg-33 data_residency must be canada");
        assertTrue(controls.path("fips_crypto").asBoolean(),
                "itsg-33 fips_crypto must be true");
    }

    @Test
    void loaderSelectsRequestedProfile() throws Exception {
        Compliance compliance = new Compliance();
        compliance.load("itsg-33");

        assertEquals("itsg-33", compliance.getProfile(),
                "loader must report the requested profile");
        assertEquals("canada", compliance.getControls().get("data_residency"),
                "loaded itsg-33 controls must carry canadian residency");
        assertEquals(true, compliance.getControls().get("fips_crypto"),
                "loaded itsg-33 controls must carry fips_crypto true");
    }
}
