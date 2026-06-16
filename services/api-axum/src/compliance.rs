//! Industry compliance profile, read at startup.
//! One repo serves every industry; COMPLIANCE_PROFILE flips a few controls.

use serde::Serialize;
use std::collections::BTreeMap;
use std::sync::OnceLock;

#[derive(Serialize, Clone)]
pub struct Controls {
    pub profile: String,
    #[serde(rename = "auditLogging")]
    pub audit_logging: bool,
    #[serde(rename = "sessionTimeoutSeconds")]
    pub session_timeout_seconds: u64,
    #[serde(rename = "mfaRequired")]
    pub mfa_required: bool,
    #[serde(rename = "encryptionInTransit")]
    pub encryption_in_transit: bool,
    pub required: BTreeMap<String, String>,
}

static ACTIVE: OnceLock<Controls> = OnceLock::new();

/// The profile this process booted with.
pub fn active() -> &'static Controls {
    ACTIVE.get_or_init(load)
}

fn load() -> Controls {
    let profile = std::env::var("COMPLIANCE_PROFILE")
        .unwrap_or_else(|_| "baseline".into())
        .to_lowercase();
    let valid = ["baseline", "hipaa", "pci", "fedramp", "fips", "pipeda"];
    if !valid.contains(&profile.as_str()) {
        eprintln!("FATAL: unknown COMPLIANCE_PROFILE: {profile}");
        std::process::exit(1);
    }

    let mut c = Controls {
        profile: profile.clone(),
        audit_logging: false,
        session_timeout_seconds: 8 * 60 * 60,
        mfa_required: false,
        encryption_in_transit: false,
        required: BTreeMap::new(),
    };
    if profile == "baseline" {
        return c;
    }

    let path = std::path::Path::new("compliance").join(format!("{profile}.yaml"));
    let text = match std::fs::read_to_string(&path) {
        Ok(t) => t,
        Err(e) => {
            // A named profile with no readable file must fail loud.
            eprintln!("FATAL: compliance profile not loadable: {profile}: {e}");
            std::process::exit(1);
        }
    };

    let mut in_block = false;
    for line in text.lines() {
        if line.starts_with("required_controls:") {
            in_block = true;
            continue;
        }
        if !in_block {
            continue;
        }
        let t = line.trim_start();
        if let Some(rest) = t.strip_prefix("- ") {
            if let Some((k, v)) = rest.split_once(':') {
                let key = k.trim().to_string();
                let val = v
                    .split('#')
                    .next()
                    .unwrap_or("")
                    .trim()
                    .trim_matches(|ch| ch == '"' || ch == '\'')
                    .to_string();
                match key.as_str() {
                    "audit_logging" => c.audit_logging = val == "true",
                    "mfa_required" => c.mfa_required = val == "true",
                    "encryption_in_transit" => c.encryption_in_transit = val == "true",
                    "session_timeout" => {
                        if let Ok(n) = val.parse() {
                            c.session_timeout_seconds = n;
                        }
                    }
                    _ => {}
                }
                c.required.insert(key, val);
            }
        } else if !line.is_empty() && !line.starts_with(char::is_whitespace) {
            break;
        }
    }
    c
}
