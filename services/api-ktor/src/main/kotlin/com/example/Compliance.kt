package com.example

import java.io.File
import kotlin.system.exitProcess

// Industry compliance profile, read at startup.
// One repo serves every industry; COMPLIANCE_PROFILE flips a few controls.
object Compliance {
    val profile: String
    val auditLogging: Boolean
    val sessionTimeoutSeconds: Long
    val mfaRequired: Boolean
    val encryptionInTransit: Boolean
    val required: LinkedHashMap<String, String> = LinkedHashMap()

    init {
        val p = (System.getenv("COMPLIANCE_PROFILE") ?: "baseline").lowercase()
        val valid = setOf("baseline", "hipaa", "pci", "fedramp", "fips", "pipeda")
        if (p !in valid) {
            System.err.println("FATAL: unknown COMPLIANCE_PROFILE: $p")
            exitProcess(1)
        }
        profile = p

        var audit = false
        var session = 8L * 60 * 60
        var mfa = false
        var enc = false

        if (p != "baseline") {
            val f = File("compliance/$p.yaml")
            if (!f.exists()) {
                // A named profile with no readable file must fail loud.
                System.err.println("FATAL: compliance profile not loadable: $p")
                exitProcess(1)
            }
            var inBlock = false
            for (line in f.readLines()) {
                if (line.startsWith("required_controls:")) {
                    inBlock = true
                    continue
                }
                if (!inBlock) continue
                val t = line.trimStart()
                if (t.startsWith("- ")) {
                    val kv = t.substring(2).split(":", limit = 2)
                    if (kv.size == 2) {
                        val key = kv[0].trim()
                        val v = kv[1].split("#", limit = 2)[0].trim().trim('"', '\'')
                        required[key] = v
                        when (key) {
                            "audit_logging" -> audit = v == "true"
                            "mfa_required" -> mfa = v == "true"
                            "encryption_in_transit" -> enc = v == "true"
                            "session_timeout" -> v.toLongOrNull()?.let { session = it }
                        }
                    }
                } else if (line.isNotEmpty() && !line[0].isWhitespace()) {
                    // Reached the next top-level key (e.g. pipeline_additions).
                    break
                }
            }
        }

        auditLogging = audit
        sessionTimeoutSeconds = session
        mfaRequired = mfa
        encryptionInTransit = enc
    }
}
