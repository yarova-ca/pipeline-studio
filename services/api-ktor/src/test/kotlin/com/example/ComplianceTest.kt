package com.example

import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.jsonPrimitive
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

// Validates the compliance catalog (compliance/profiles.json) and the loader.
// Gradle runs tests with the working dir at the module root, so the relative
// path "compliance/profiles.json" resolves to the catalog under test.
class ComplianceTest {

    @Test
    fun everyProfileHasTheSameControlKeys() {
        val keysByProfile = ComplianceLoader.allControlKeys()
        assertTrue(keysByProfile.size >= 2, "expected multiple profiles in the catalog")

        val baseline = keysByProfile["baseline"]
        assertNotNull(baseline, "baseline profile must exist")
        assertTrue(baseline.isNotEmpty(), "baseline must declare control keys")

        for ((profileName, keys) in keysByProfile) {
            assertEquals(
                baseline,
                keys,
                "profile '$profileName' has different control keys than baseline",
            )
        }
    }

    @Test
    fun itsg33HasCanadianResidencyAndFipsCrypto() {
        val policy = ComplianceLoader.load("itsg-33")
        assertNotNull(policy, "itsg-33 profile must load")

        assertEquals(
            "canada",
            policy.controls["data_residency"]?.jsonPrimitive?.content,
            "itsg-33 data_residency must be canada",
        )
        assertEquals(
            true,
            policy.controls["fips_crypto"]?.jsonPrimitive?.boolean,
            "itsg-33 fips_crypto must be true",
        )
    }

    @Test
    fun loaderWithItsg33ProfileReturnsThatProfile() {
        // The loader selects a profile by the same string COMPLIANCE_PROFILE supplies.
        // Setting COMPLIANCE_PROFILE=itsg-33 must therefore resolve to profile "itsg-33".
        val policy = ComplianceLoader.load("itsg-33")
        assertNotNull(policy, "itsg-33 profile must load")
        assertEquals("itsg-33", policy.profile, "loaded profile id must be itsg-33")
    }
}
