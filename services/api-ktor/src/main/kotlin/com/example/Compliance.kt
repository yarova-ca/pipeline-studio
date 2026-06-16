package com.example

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import java.io.File
import kotlin.system.exitProcess

// Industry compliance profile, read at startup from compliance/profiles.json.
// One repo serves every industry; COMPLIANCE_PROFILE selects one of the 30 profiles.
// The catalog is generated; all profiles share the same control keys (uniform on/off).

// The resolved active profile: name, jurisdiction and the raw control map.
// Controls keep their JSON type — bool, number or string — as JsonElement.
data class CompliancePolicy(
    val profile: String,
    val name: String,
    val jurisdiction: String,
    val controls: Map<String, JsonElement>,
)

object ComplianceLoader {
    private val json = Json { ignoreUnknownKeys = true }

    // Load the named profile from compliance/profiles.json in the working dir.
    // Returns null when the file is missing or the profile name is not present.
    fun load(profileName: String, file: File = File("compliance/profiles.json")): CompliancePolicy? {
        if (!file.exists()) return null
        val root = json.parseToJsonElement(file.readText()).jsonObject
        val profiles = root["profiles"]?.jsonObject ?: return null
        val profile = profiles[profileName]?.jsonObject ?: return null
        return profile.toPolicy(profileName)
    }

    // Read every profile's controls keyed by profile name. Used for uniformity checks.
    fun allControlKeys(file: File = File("compliance/profiles.json")): Map<String, Set<String>> {
        val root = json.parseToJsonElement(file.readText()).jsonObject
        val profiles = root["profiles"]?.jsonObject ?: return emptyMap()
        return profiles.mapValues { (_, el) ->
            (el.jsonObject["controls"]?.jsonObject ?: JsonObject(emptyMap())).keys.toSet()
        }
    }

    private fun JsonObject.toPolicy(profileName: String): CompliancePolicy {
        val name = this["name"]?.jsonPrimitive?.content ?: profileName
        val jurisdiction = this["jurisdiction"]?.jsonPrimitive?.content ?: ""
        val controls = this["controls"]?.jsonObject ?: JsonObject(emptyMap())
        return CompliancePolicy(profileName, name, jurisdiction, controls.toMap())
    }
}

// The active profile resolved from COMPLIANCE_PROFILE at startup.
// Fails loud (exit 1) when the profile cannot be loaded — never boots misconfigured.
object Compliance {
    val policy: CompliancePolicy by lazy { resolve() }

    val profile: String get() = policy.profile
    val name: String get() = policy.name
    val jurisdiction: String get() = policy.jurisdiction
    val controls: Map<String, JsonElement> get() = policy.controls

    // JWT expiry driven by the active profile's session_timeout_seconds control.
    // A value of 0 means "no idle timeout"; we fall back to an 8-hour token life.
    val sessionTimeoutSeconds: Long
        get() {
            val v = policy.controls["session_timeout_seconds"]?.jsonPrimitive?.longOrNull ?: 0L
            return if (v > 0L) v else 8L * 60 * 60
        }

    private fun resolve(): CompliancePolicy {
        val p = (System.getenv("COMPLIANCE_PROFILE") ?: "baseline").lowercase()
        return ComplianceLoader.load(p) ?: run {
            System.err.println("FATAL: compliance profile not loadable: $p")
            exitProcess(1)
        }
    }
}
